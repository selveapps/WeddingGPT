import { RSVP_LIMITS, repliesOpen, validateSettings } from './rsvp.mjs';
import { codePage, confirmationPage, formPage, messagePage } from './pages.mjs';

/**
 * RSVP routes (design E §3, slice E1a).
 *
 * Couple side, JSON, membership-checked like every workspace route:
 *   GET  /v1/workspaces/:id/rsvp/settings                 -> 200 { settings }
 *   PUT  /v1/workspaces/:id/rsvp/settings   { slug, deadline, questions } -> 200 { settings }
 *   GET  /v1/workspaces/:id/rsvp/invites                  -> 200 { invites }
 *   POST /v1/workspaces/:id/rsvp/invites    { targets }   -> 201 { invites: [{ url, code, ... }] }
 *   POST /v1/workspaces/:id/rsvp/invites/:inviteId/revoke -> 204
 *
 * Guest side, HTML, no account:
 *   GET|POST /r/:token        the form for one invitation
 *   GET|POST /w/:slug/rsvp    type the code from a paper invitation
 */

const TARGET_ID = /^[A-Za-z0-9_-]{1,128}$/;
const HOUR = 60 * 60 * 1000;

/** Counts per key over a sliding window. */
function createWindowLimiter(limit, windowMs) {
  const hits = new Map();
  return (key) => {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(key, recent);
    return recent.length > limit;
  };
}

export const RSVP_RATE_LIMITS = {
  codeAttemptsPerIpPerHour: 10,
  codeAttemptsPerWeddingPerHour: 50,
  pageRequestsPerIpPerMinute: 60,
};

export function registerRsvpRoutes(router, { db, send, sendHtml, readJson, readForm, clientIp, publicBaseUrl }) {
  const codePerIp = createWindowLimiter(RSVP_RATE_LIMITS.codeAttemptsPerIpPerHour, HOUR);
  const codePerWedding = createWindowLimiter(RSVP_RATE_LIMITS.codeAttemptsPerWeddingPerHour, HOUR);
  const pagePerIp = createWindowLimiter(RSVP_RATE_LIMITS.pageRequestsPerIpPerMinute, 60 * 1000);

  // --- Couple side ---------------------------------------------------------------

  router.add('GET', '/v1/workspaces/:id/rsvp/settings', (req, res, { workspace }) =>
    send(res, 200, { settings: db.rsvp.getSettings(workspace.id) })
  );

  router.add('PUT', '/v1/workspaces/:id/rsvp/settings', async (req, res, { workspace }) => {
    const body = await readJson(req);
    const fields = validateSettings(body);
    if (fields) return send(res, 400, { error: 'invalid', fields });
    const result = db.rsvp.saveSettings(workspace.id, {
      slug: body.slug,
      deadline: body.deadline,
      questions: body.questions,
    });
    if (result.error) return send(res, 409, { error: result.error });
    return send(res, 200, { settings: result.settings });
  });

  router.add('GET', '/v1/workspaces/:id/rsvp/invites', (req, res, { workspace }) =>
    send(res, 200, { invites: db.rsvp.listInvites(workspace.id) })
  );

  router.add('POST', '/v1/workspaces/:id/rsvp/invites', async (req, res, { workspace }) => {
    const { targets } = await readJson(req);
    const valid =
      Array.isArray(targets) &&
      targets.length > 0 &&
      targets.length <= RSVP_LIMITS.invitesPerRequest &&
      targets.every(
        (target) =>
          (target?.type === 'household' || target?.type === 'guest') &&
          typeof target.id === 'string' &&
          TARGET_ID.test(target.id)
      );
    if (!valid) return send(res, 400, { error: 'invalid' });
    const invites = db.rsvp.createInvites(workspace.id, targets).map(({ token, ...invite }) => ({
      ...invite,
      url: `${publicBaseUrl}/r/${token}`,
    }));
    return send(res, 201, { invites });
  });

  router.add('POST', '/v1/workspaces/:id/rsvp/invites/:inviteId/revoke', (req, res, { workspace, params }) =>
    db.rsvp.revoke(workspace.id, params.inviteId) ? send(res, 204) : send(res, 404, { error: 'not_found' })
  );

  // --- Guest side ----------------------------------------------------------------

  const browser = { access: 'public', browser: true };
  const inactive = () =>
    messagePage({
      title: 'This link is no longer active',
      message: 'Please check the invitation, or contact the couple for a new link.',
    });
  const tooMany = () =>
    messagePage({ title: 'Please wait a moment', message: 'Too many tries from this connection. Try again later.' });

  /** `form` is the already-read POST body, or null for a GET. A body can only be read once. */
  function invitationForm(res, invite, { action, hidden, form }) {
    const context = db.rsvp.formContext(invite);
    const closed = !repliesOpen(context.settings);
    if (!form || closed) {
      if (!form) db.rsvp.markOpened(invite);
      return sendHtml(res, 200, formPage({ context, action, hidden, closed }));
    }
    if (!form.submit) return sendHtml(res, 200, formPage({ context, action, hidden }));
    const result = db.rsvp.submit(invite, form);
    if (result.errors) return sendHtml(res, 400, formPage({ context, action, hidden, errors: result.errors }));
    return sendHtml(res, 200, confirmationPage({ context: db.rsvp.formContext(invite), response: result.response }));
  }

  const byToken = async (req, res, { params }) => {
    if (pagePerIp(clientIp(req))) return sendHtml(res, 429, tooMany());
    const invite = db.rsvp.findByToken(params.token);
    if (!invite) return sendHtml(res, 404, inactive());
    const form = req.method === 'POST' ? await readForm(req) : null;
    return invitationForm(res, invite, { action: `/r/${encodeURIComponent(params.token)}`, hidden: {}, form });
  };
  router.add('GET', '/r/:token', byToken, browser);
  router.add('POST', '/r/:token', byToken, browser);

  const byCode = async (req, res, { params }) => {
    const workspaceId = db.rsvp.workspaceForSlug(params.slug);
    if (!workspaceId) {
      return sendHtml(res, 404, messagePage({ title: 'Page not found', message: 'Check the address on your invitation.' }));
    }
    const wedding = db.sync.liveRecords(workspaceId, 'wedding')[0]?.data ?? null;
    const action = `/w/${encodeURIComponent(params.slug)}/rsvp`;
    if (req.method === 'GET') return sendHtml(res, 200, codePage({ wedding, action }));

    const form = await readForm(req);
    // Every code lookup counts, so guessing is slow per address and per wedding (W1).
    if (codePerIp(clientIp(req)) || codePerWedding(workspaceId)) return sendHtml(res, 429, tooMany());
    const invite = db.rsvp.findByCode(workspaceId, form.code);
    if (!invite) {
      return sendHtml(res, 400, codePage({ wedding, action, error: 'That code does not match an invitation here.' }));
    }
    return invitationForm(res, invite, { action, hidden: { code: form.code }, form });
  };
  router.add('GET', '/w/:slug/rsvp', byCode, browser);
  router.add('POST', '/w/:slug/rsvp', byCode, browser);
}
