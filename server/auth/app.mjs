import http from 'node:http';

import { publicUser } from './db.mjs';
import { burnPasswordCheck, hashPassword, verifyPassword } from './passwords.mjs';
import { createRouter } from './router.mjs';
import { pageHeaders } from './rsvp/html.mjs';
import { registerRsvpRoutes } from './rsvp/routes.mjs';
import { AcceptResult } from './invites.mjs';
import { SYNC_LIMITS, parsePullQuery } from './sync.mjs';
import { Role, WORKSPACE_LIMITS, canRemoveMember, validateWorkspaceName } from './workspaces.mjs';

/**
 * WeddingGPT API server: accounts, and the workspaces a couple shares.
 * The contract is docs/planning/M1-accounts-sync-design.md section 5.
 *
 *   POST   /v1/auth/register              { name, email, password } -> 201 { user, token, expiresAt }
 *   POST   /v1/auth/login                 { email, password }       -> 200 { user, token, expiresAt }
 *   GET    /v1/auth/me                                              -> 200 { user }
 *   POST   /v1/auth/logout                                          -> 204
 *   GET    /v1/workspaces                                           -> 200 { workspaces }
 *   POST   /v1/workspaces                 { name }                  -> 201 { workspace }
 *   GET    /v1/workspaces/:id/members                               -> 200 { members }
 *   DELETE /v1/workspaces/:id/members/:userId                       -> 204
 *   POST   /v1/workspaces/:id/sync/push   { mutations }             -> 200 { applied, conflicts, rejected }
 *   GET    /v1/workspaces/:id/sync/pull?since=&limit=               -> 200 { records, cursor, hasMore }
 *   POST   /v1/workspaces/:id/invites                               -> 201 { token, url, expiresAt } (owner)
 *   DELETE /v1/workspaces/:id/invites                               -> 204 (owner)
 *   POST   /v1/invites/accept            { token }                 -> 200 { workspace }
 *   GET    /health                                                  -> 200 { ok: true }
 *
 * Everything except register, login and health needs `Authorization: Bearer
 * <token>`. Errors are `{ error: code }`, plus `fields` for a 400. A failed
 * sign-in never says whether the email exists, and a workspace the caller is
 * not a member of is a 404, never a 403, so workspace ids cannot be probed.
 */

export const LIMITS = {
  bodyBytes: 8 * 1024,
  emailChars: 254,
  nameChars: 60,
  passwordMin: 8,
  // scrypt hashes any length, but an unbounded input is a cheap way to burn CPU.
  passwordMax: 128,
  attemptsPerMinute: 10,
};

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// --- Validation ------------------------------------------------------------------

export function normaliseEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

/** Returns `{ field: code }` for every problem, or null when the input is fine. */
export function validateRegistration({ name, email, password } = {}) {
  const fields = {};
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = normaliseEmail(email);

  if (cleanName.length > LIMITS.nameChars) fields.name = 'too_long';
  if (!cleanEmail) fields.email = 'required';
  else if (cleanEmail.length > LIMITS.emailChars || !EMAIL_PATTERN.test(cleanEmail)) fields.email = 'invalid';
  if (typeof password !== 'string' || password.length === 0) fields.password = 'required';
  else if (password.length < LIMITS.passwordMin) fields.password = 'too_short';
  else if (password.length > LIMITS.passwordMax) fields.password = 'too_long';

  return Object.keys(fields).length ? fields : null;
}

// --- Request hygiene -------------------------------------------------------------

function createRateLimiter(limit) {
  const hits = new Map();
  return (key) => {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
    recent.push(now);
    hits.set(key, recent);
    return recent.length > limit;
  };
}

function readBody(req, limit = LIMITS.bodyBytes) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      // Keep draining rather than destroying the socket, so the 413 reaches the client.
      if (size > limit) reject(Object.assign(new Error('too large'), { status: 413 }));
      else chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const FORM_BYTES = 16 * 1024;

/** An `application/x-www-form-urlencoded` body as a plain object. */
async function readForm(req) {
  const text = await readBody(req, FORM_BYTES);
  return Object.fromEntries(new URLSearchParams(text));
}

function clientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
}

async function readJson(req, limit) {
  const text = await readBody(req, limit);
  const body = JSON.parse(text || '{}');
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('not an object');
  return body;
}

function bearerToken(req) {
  const header = req.headers.authorization ?? '';
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  return match ? match[1] : null;
}

// --- Server ----------------------------------------------------------------------

/**
 * Build the HTTP server. Nothing is read from the environment here, so tests
 * can run it against an in-memory database on a random port.
 */
export function createAuthServer({
  db,
  appToken = null,
  allowedOrigin = '*',
  inviteUrlBase = 'weddinggpt://invite/',
  /** Where guests open RSVP pages, e.g. https://rsvp.weddinggpt.app (decision D7). */
  publicBaseUrl = 'http://localhost:8788',
  log = console,
} = {}) {
  const rateLimited = createRateLimiter(LIMITS.attemptsPerMinute);

  function sendHtml(res, status, body, { indexable = false } = {}) {
    res.writeHead(status, pageHeaders({ indexable }));
    res.end(String(body));
  }

  function send(res, status, body) {
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-Token',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    });
    res.end(body === undefined ? '' : JSON.stringify(body));
  }

  function startSession(res, status, user) {
    const { token, expiresAt } = db.createSession(user.id, SESSION_TTL_MS);
    return send(res, status, { user: publicUser(user), token, expiresAt });
  }

  async function register(req, res) {
    const body = await readJson(req);
    const fields = validateRegistration(body);
    if (fields) return send(res, 400, { error: 'invalid', fields });

    const user = db.createUser({
      email: normaliseEmail(body.email),
      name: typeof body.name === 'string' ? body.name.trim() : '',
      passwordHash: await hashPassword(body.password),
    });
    if (!user) return send(res, 409, { error: 'email_taken' });

    log.info?.(`[auth] registered ${user.id}`);
    return startSession(res, 201, user);
  }

  async function login(req, res) {
    const body = await readJson(req);
    const email = normaliseEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password || password.length > LIMITS.passwordMax) {
      return send(res, 400, { error: 'invalid' });
    }

    const user = db.findUserByEmail(email);
    const ok = user
      ? await verifyPassword(password, user.password_hash)
      : await burnPasswordCheck(password);
    if (!ok) return send(res, 401, { error: 'invalid_credentials' });

    return startSession(res, 200, user);
  }

  function me(req, res) {
    const user = db.userForToken(bearerToken(req));
    if (!user) return send(res, 401, { error: 'unauthorised' });
    return send(res, 200, { user: publicUser(user) });
  }

  function logout(req, res) {
    db.deleteSession(bearerToken(req));
    return send(res, 204);
  }

  // --- Workspaces (slice A1) ------------------------------------------------

  function listWorkspaces(req, res, { user }) {
    return send(res, 200, { workspaces: db.workspaces.listForUser(user.id) });
  }

  async function createWorkspace(req, res, { user }) {
    const body = await readJson(req);
    const fields = validateWorkspaceName(body.name);
    if (fields) return send(res, 400, { error: 'invalid', fields });
    if (db.workspaces.countForUser(user.id) >= WORKSPACE_LIMITS.perUser) {
      return send(res, 403, { error: 'limit_reached' });
    }
    const workspace = db.workspaces.create(user.id, body.name);
    log.info?.(`[workspaces] ${user.id} created ${workspace.id}`);
    return send(res, 201, { workspace });
  }

  function listMembers(req, res, { workspace }) {
    return send(res, 200, { members: db.workspaces.members(workspace.id) });
  }

  function removeMember(req, res, { user, workspace, params }) {
    const target = db.workspaces.membership(workspace.id, params.userId);
    if (!target) return send(res, 404, { error: 'not_found' });
    const allowed = canRemoveMember({
      actorRole: workspace.role,
      actorId: user.id,
      targetRole: target.role,
      targetId: params.userId,
    });
    if (!allowed) return send(res, 403, { error: 'forbidden' });
    db.workspaces.removeMember(workspace.id, params.userId);
    log.info?.(`[workspaces] ${user.id} removed ${params.userId} from ${workspace.id}`);
    return send(res, 204);
  }

  // --- Sync (slice A2) ------------------------------------------------------

  async function syncPush(req, res, { user, workspace }) {
    const body = await readJson(req, SYNC_LIMITS.requestBytes);
    const { mutations } = body;
    if (!Array.isArray(mutations) || mutations.length === 0) return send(res, 400, { error: 'invalid' });
    if (mutations.length > SYNC_LIMITS.mutationsPerPush) return send(res, 413, { error: 'too_large' });
    return send(res, 200, db.sync.push(workspace.id, user.id, mutations));
  }

  function syncPull(req, res, { user, workspace, query }) {
    const options = parsePullQuery(query);
    if (!options) return send(res, 400, { error: 'invalid' });
    return send(res, 200, db.sync.pull(workspace.id, user.id, options));
  }

  // --- Invites (slice A5) ----------------------------------------------------

  function createInvite(req, res, { user, workspace }) {
    if (workspace.role !== Role.OWNER) return send(res, 403, { error: 'forbidden' });
    const { token, expiresAt } = db.invites.create(workspace.id, user.id);
    log.info?.(`[invites] ${user.id} created an invite for ${workspace.id}`);
    return send(res, 201, { token, url: `${inviteUrlBase}${token}`, expiresAt });
  }

  function revokeInvites(req, res, { workspace }) {
    if (workspace.role !== Role.OWNER) return send(res, 403, { error: 'forbidden' });
    db.invites.revokeOpen(workspace.id);
    return send(res, 204);
  }

  async function acceptInvite(req, res, { user }) {
    const body = await readJson(req);
    const { result, workspace } = db.invites.accept(body.token, user.id);
    // Unknown, used, expired and revoked all look the same from outside.
    if (result === AcceptResult.INVALID) return send(res, 404, { error: 'not_found' });
    if (result === AcceptResult.FULL) return send(res, 409, { error: 'workspace_full' });
    if (result === AcceptResult.JOINED) log.info?.(`[invites] ${user.id} joined ${workspace.id}`);
    return send(res, 200, { workspace, alreadyMember: result === AcceptResult.ALREADY_MEMBER });
  }

  // --- Routing ---------------------------------------------------------------
  //
  // `access`: 'public' (no session), 'user' (a valid session) or 'member'
  // (a valid session *and* a membership of the `:id` workspace). The checks
  // live here, once, so no handler can forget them.

  const router = createRouter()
    .add('POST', '/v1/auth/register', register, { access: 'public', limited: true })
    .add('POST', '/v1/auth/login', login, { access: 'public', limited: true })
    .add('GET', '/v1/auth/me', me, { access: 'public' })
    .add('POST', '/v1/auth/logout', logout, { access: 'public' })
    .add('GET', '/v1/workspaces', listWorkspaces, { access: 'user' })
    .add('POST', '/v1/workspaces', createWorkspace, { access: 'user', limited: true })
    .add('GET', '/v1/workspaces/:id/members', listMembers, { access: 'member' })
    .add('DELETE', '/v1/workspaces/:id/members/:userId', removeMember, { access: 'member' })
    .add('POST', '/v1/workspaces/:id/sync/push', syncPush, { access: 'member' })
    .add('GET', '/v1/workspaces/:id/sync/pull', syncPull, { access: 'member' })
    .add('POST', '/v1/workspaces/:id/invites', createInvite, { access: 'member', limited: true })
    .add('DELETE', '/v1/workspaces/:id/invites', revokeInvites, { access: 'member' })
    .add('POST', '/v1/invites/accept', acceptInvite, { access: 'user', limited: true });

  // RSVP: couple-side routes default to membership checks; guest pages opt out.
  const rsvpRouter = {
    add(method, pattern, handler, options = { access: 'member' }) {
      router.add(method, pattern, handler, options);
      return this;
    },
  };
  registerRsvpRoutes(rsvpRouter, {
    db,
    send,
    sendHtml,
    readJson,
    readForm,
    clientIp,
    publicBaseUrl: publicBaseUrl.replace(/\/+$/, ''),
  });

  return http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') return send(res, 204);
    if (req.method === 'GET' && req.url === '/health') return send(res, 200, { ok: true });

    const route = router.match(req.method, req.url);
    if (!route) return send(res, 404, { error: 'not_found' });
    if (route.methodNotAllowed) return send(res, 405, { error: 'method_not_allowed' });

    // Guest pages are opened by browsers, which never carry the app's token.
    if (appToken && !route.options.browser && req.headers['x-app-token'] !== appToken) {
      return send(res, 401, { error: 'unauthorised' });
    }

    if (route.options.limited) {
      const ip = clientIp(req);
      if (rateLimited(ip)) return send(res, 429, { error: 'rate_limited' });
    }

    const ctx = { params: route.params, query: route.query, user: null, workspace: null };

    if (route.options.access !== 'public') {
      ctx.user = db.userForToken(bearerToken(req));
      if (!ctx.user) return send(res, 401, { error: 'unauthorised' });
    }
    if (route.options.access === 'member') {
      ctx.workspace = db.workspaces.membership(route.params.id, ctx.user.id);
      // 404, not 403: a non-member cannot tell a real workspace id from a made-up one.
      if (!ctx.workspace) return send(res, 404, { error: 'not_found' });
    }

    try {
      return await route.handler(req, res, ctx);
    } catch (error) {
      if (error?.status === 413) return send(res, 413, { error: 'too_large' });
      if (error instanceof SyntaxError || error?.message === 'not an object') {
        return send(res, 400, { error: 'bad_request' });
      }
      log.error?.('[auth] unexpected failure:', error?.message ?? error);
      return send(res, 500, { error: 'internal' });
    }
  });
}
