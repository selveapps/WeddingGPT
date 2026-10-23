import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { hashPassword, verifyPassword } from '../passwords.mjs';

/**
 * The public wedding website (design E §4, slice E2).
 *
 * Content - welcome, schedule, places, travel, stays, registry, FAQ - is the
 * couple's synced `website` record. Who may see it lives here, on the server,
 * set through the API: a phone cannot publish or unlock the site by syncing.
 *
 *  visibility  'off' (default), 'public' or 'password'
 *  indexable   search engines may index it (decision D9: off by default)
 *  password    stored only as a scrypt hash; a correct one sets a cookie for
 *              this one site, signed with a server secret and tied to the hash,
 *              so changing the password signs every visitor out
 */

export const Visibility = {
  OFF: 'off',
  PUBLIC: 'public',
  PASSWORD: 'password',
};

export const SITE_LIMITS = {
  passwordMin: 6,
  passwordMax: 64,
  cookieDays: 30,
  textChars: 4000,
  itemsPerSection: 30,
};

export const SITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS site_settings (
    workspace_id   TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
    visibility     TEXT NOT NULL DEFAULT 'off' CHECK (visibility IN ('off', 'public', 'password')),
    indexable      INTEGER NOT NULL DEFAULT 0,
    password_hash  TEXT,
    updated_at     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS server_secrets (
    name   TEXT PRIMARY KEY,
    value  TEXT NOT NULL
  );
`;

/** Returns `{ field: code }` for bad settings, or null. */
export function validateSiteSettings({ visibility, indexable, password } = {}) {
  const fields = {};
  if (visibility !== undefined && !Object.values(Visibility).includes(visibility)) fields.visibility = 'invalid';
  if (indexable !== undefined && typeof indexable !== 'boolean') fields.indexable = 'invalid';
  if (password !== undefined && password !== null) {
    if (typeof password !== 'string') fields.password = 'invalid';
    else if (password.length < SITE_LIMITS.passwordMin) fields.password = 'too_short';
    else if (password.length > SITE_LIMITS.passwordMax) fields.password = 'too_long';
  }
  return Object.keys(fields).length ? fields : null;
}

/** Only http(s) links are ever rendered: `javascript:` and `data:` URLs can run code (W3). */
export function safeUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/** A map search for an address, so guests get real directions. */
export function mapUrl(address) {
  const query = String(address ?? '').trim();
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}

const text = (value) => (typeof value === 'string' ? value.trim().slice(0, SITE_LIMITS.textChars) : '');
const list = (value) => (Array.isArray(value) ? value.slice(0, SITE_LIMITS.itemsPerSection) : []);

/**
 * The couple's record, reduced to what the page may show. Anything unexpected
 * is dropped, links that are not http(s) are removed, and no guest data is
 * ever part of it.
 */
export function sanitiseContent(data) {
  const welcome = data?.welcome ?? {};
  return {
    welcomeTitle: text(welcome.title),
    welcomeBody: text(welcome.body),
    events: list(data?.events)
      .map((event) => ({
        name: text(event?.name),
        date: /^\d{4}-\d{2}-\d{2}$/.test(event?.date ?? '') ? event.date : null,
        time: text(event?.time).slice(0, 40),
        place: text(event?.place),
        address: text(event?.address),
        notes: text(event?.notes),
      }))
      .filter((event) => event.name || event.place),
    travel: text(data?.travel),
    stays: list(data?.stays)
      .map((stay) => ({ name: text(stay?.name), url: safeUrl(stay?.url), notes: text(stay?.notes) }))
      .filter((stay) => stay.name),
    registry: list(data?.registry)
      .map((item) => ({ name: text(item?.name), url: safeUrl(item?.url) }))
      .filter((item) => item.name && item.url),
    faq: list(data?.faq)
      .map((item) => ({ question: text(item?.question), answer: text(item?.answer) }))
      .filter((item) => item.question && item.answer),
  };
}

const toSettings = (row) => ({
  visibility: row?.visibility ?? Visibility.OFF,
  indexable: Boolean(row?.indexable),
  hasPassword: Boolean(row?.password_hash),
  updatedAt: row?.updated_at ?? null,
});

export function createSiteRepository(db) {
  db.exec(SITE_SCHEMA);

  const statements = {
    get: db.prepare('SELECT * FROM site_settings WHERE workspace_id = ?'),
    upsert: db.prepare(
      `INSERT INTO site_settings (workspace_id, visibility, indexable, password_hash, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (workspace_id) DO UPDATE SET visibility = excluded.visibility, indexable = excluded.indexable,
         password_hash = excluded.password_hash, updated_at = excluded.updated_at`
    ),
    getSecret: db.prepare('SELECT value FROM server_secrets WHERE name = ?'),
    putSecret: db.prepare('INSERT OR IGNORE INTO server_secrets (name, value) VALUES (?, ?)'),
  };

  // One secret per database, made on first use, for signing site cookies.
  statements.putSecret.run('site_cookie', randomBytes(32).toString('hex'));
  const secret = statements.getSecret.get('site_cookie').value;

  const sign = (payload) => createHmac('sha256', secret).update(payload).digest('base64url');

  return {
    getSettings(workspaceId) {
      return toSettings(statements.get.get(workspaceId));
    },

    /**
     * Save settings; fields left out keep their value. `password: null`
     * removes it. Password visibility without a password is refused.
     * Resolves `{ settings }` or `{ error }`.
     */
    async saveSettings(workspaceId, patch, { now = new Date() } = {}) {
      const row = statements.get.get(workspaceId);
      const visibility = patch.visibility ?? row?.visibility ?? Visibility.OFF;
      const indexable = patch.indexable ?? Boolean(row?.indexable);
      let passwordHash = row?.password_hash ?? null;
      if (patch.password === null) passwordHash = null;
      else if (typeof patch.password === 'string') passwordHash = await hashPassword(patch.password);
      if (visibility === Visibility.PASSWORD && !passwordHash) return { error: 'password_required' };
      // A password-protected site is never indexed, whatever the toggle says.
      statements.upsert.run(
        workspaceId,
        visibility,
        indexable && visibility === Visibility.PUBLIC ? 1 : 0,
        passwordHash,
        now.toISOString()
      );
      return { settings: this.getSettings(workspaceId) };
    },

    async checkPassword(workspaceId, password) {
      const row = statements.get.get(workspaceId);
      if (!row?.password_hash || typeof password !== 'string' || password.length > SITE_LIMITS.passwordMax) {
        return false;
      }
      return verifyPassword(password, row.password_hash);
    },

    /** A cookie value proving the visitor knew this site's current password. */
    passCookie(workspaceId, { now = new Date() } = {}) {
      const row = statements.get.get(workspaceId);
      const expires = now.getTime() + SITE_LIMITS.cookieDays * 86400000;
      const payload = `${workspaceId}.${expires}.${row?.password_hash ?? ''}`;
      return `${expires}.${sign(payload)}`;
    },

    hasValidPass(workspaceId, cookieValue, { now = new Date() } = {}) {
      const row = statements.get.get(workspaceId);
      if (!row?.password_hash || typeof cookieValue !== 'string') return false;
      const [expiresText, signature] = cookieValue.split('.');
      const expires = Number(expiresText);
      if (!Number.isFinite(expires) || expires < now.getTime() || !signature) return false;
      const expected = Buffer.from(sign(`${workspaceId}.${expires}.${row.password_hash}`));
      const given = Buffer.from(signature);
      return expected.length === given.length && timingSafeEqual(expected, given);
    },
  };
}
