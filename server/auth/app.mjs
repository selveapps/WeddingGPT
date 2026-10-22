import http from 'node:http';

import { publicUser } from './db.mjs';
import { burnPasswordCheck, hashPassword, verifyPassword } from './passwords.mjs';

/**
 * WeddingGPT account server: create an account, sign in, check a session,
 * sign out.
 *
 *   POST /v1/auth/register  { name, email, password }  -> 201 { user, token, expiresAt }
 *   POST /v1/auth/login     { email, password }        -> 200 { user, token, expiresAt }
 *   GET  /v1/auth/me        Authorization: Bearer <token> -> 200 { user }
 *   POST /v1/auth/logout    Authorization: Bearer <token> -> 204
 *   GET  /health                                       -> 200 { ok: true }
 *
 * Errors are `{ error: code }`, plus `fields` for a 400 so the app can mark the
 * right input. A failed sign-in never says whether the email exists.
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

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      // Keep draining rather than destroying the socket, so the 413 reaches the client.
      if (size > LIMITS.bodyBytes) reject(Object.assign(new Error('too large'), { status: 413 }));
      else chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function readJson(req) {
  const text = await readBody(req);
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
export function createAuthServer({ db, appToken = null, allowedOrigin = '*', log = console } = {}) {
  const rateLimited = createRateLimiter(LIMITS.attemptsPerMinute);

  function send(res, status, body) {
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-Token',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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

  const routes = {
    'POST /v1/auth/register': { handler: register, limited: true },
    'POST /v1/auth/login': { handler: login, limited: true },
    'GET /v1/auth/me': { handler: me },
    'POST /v1/auth/logout': { handler: logout },
  };

  return http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') return send(res, 204);
    if (req.method === 'GET' && req.url === '/health') return send(res, 200, { ok: true });

    const route = routes[`${req.method} ${req.url}`];
    if (!route) return send(res, 404, { error: 'not_found' });

    if (appToken && req.headers['x-app-token'] !== appToken) return send(res, 401, { error: 'unauthorised' });

    if (route.limited) {
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
      if (rateLimited(ip)) return send(res, 429, { error: 'rate_limited' });
    }

    try {
      return await route.handler(req, res);
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
