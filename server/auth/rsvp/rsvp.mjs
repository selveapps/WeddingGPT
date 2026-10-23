import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';

/**
 * RSVP settings, invites and replies (design E §3, slice E1a).
 *
 * Each invite has two ways in:
 *  - a link with a 128-bit random token, for messages and QR codes
 *  - an 8-character code for typing from a paper invitation, valid only on
 *    its own wedding's page (it is hashed together with the workspace id)
 * Both are stored only as hashes (threat W1).
 *
 * A reply is written as a sync record in `rsvpResponses`, one per invite,
 * through the sync repository - never as an edit to the guest records, so a
 * guest can never overwrite the couple's data (W10). The couple's app applies
 * replies when it syncs.
 */

export const RSVP_LIMITS = {
  invitesPerRequest: 300,
  messageChars: 1000,
  dietaryChars: 300,
  plusOneNameChars: 80,
  /** Without a deadline, links still stop working eventually. */
  defaultTtlDays: 365,
  /** After the RSVP deadline, links keep working this long, read-only. */
  afterDeadlineDays: 30,
};

/** No 0/O, 1/I/L - codes are read off paper and typed on phones. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 8;

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;
const RESERVED_SLUGS = new Set([
  'admin', 'api', 'app', 'auth', 'health', 'help', 'login', 'r', 'rsvp', 'support', 'w', 'www', 'weddinggpt',
]);

export const DEFAULT_QUESTIONS = { meals: true, dietary: true, plusOnes: true, message: true };

/**
 * Meal choices guests may pick. Mirrors MealPreference in src/models/enums.js;
 * keep the two lists in step.
 */
export const MEAL_CHOICES = [
  { value: 'standard', label: 'Standard' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'jain', label: 'Jain' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'gluten_free', label: 'Gluten free' },
  { value: 'child', label: "Children's meal" },
];

export const RSVP_SCHEMA = `
  CREATE TABLE IF NOT EXISTS rsvp_settings (
    workspace_id  TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
    slug          TEXT UNIQUE,
    deadline      TEXT,
    questions     TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rsvp_invites (
    id              TEXT PRIMARY KEY,
    workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    target_type     TEXT NOT NULL CHECK (target_type IN ('household', 'guest')),
    target_id       TEXT NOT NULL,
    token_hash      TEXT NOT NULL UNIQUE,
    code_hash       TEXT NOT NULL,
    created_at      TEXT NOT NULL,
    expires_at      TEXT NOT NULL,
    revoked_at      TEXT,
    last_opened_at  TEXT,
    responded_at    TEXT
  );
  CREATE INDEX IF NOT EXISTS rsvp_invites_workspace ON rsvp_invites(workspace_id);
  CREATE INDEX IF NOT EXISTS rsvp_invites_code ON rsvp_invites(workspace_id, code_hash);
`;

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const tokenHash = (token) => sha256(`token:${token}`);
/** Scoped to the wedding: the same code on another wedding's page hashes differently. */
const codeHash = (workspaceId, code) => sha256(`code:${workspaceId}:${normaliseCode(code)}`);

export function normaliseCode(code) {
  return String(code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function generateCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

/** `ABCD-EFGH`: easier to read off paper. */
export const formatCode = (code) => `${code.slice(0, 4)}-${code.slice(4)}`;

// --- Validation ---------------------------------------------------------------------

/** Returns `{ field: code }` for bad settings, or null. */
export function validateSettings({ slug, deadline, questions } = {}) {
  const fields = {};
  if (slug !== undefined && slug !== null) {
    if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug)) fields.slug = 'invalid';
    else if (RESERVED_SLUGS.has(slug)) fields.slug = 'reserved';
  }
  if (deadline !== undefined && deadline !== null) {
    if (typeof deadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(deadline) || Number.isNaN(Date.parse(deadline))) {
      fields.deadline = 'invalid';
    }
  }
  if (questions !== undefined && questions !== null) {
    const ok =
      typeof questions === 'object' &&
      !Array.isArray(questions) &&
      Object.entries(questions).every(([key, value]) => key in DEFAULT_QUESTIONS && typeof value === 'boolean');
    if (!ok) fields.questions = 'invalid';
  }
  return Object.keys(fields).length ? fields : null;
}

/** The last moment a link works: 30 days after the deadline, or a year after it was made. */
function expiryFor(deadline, now) {
  if (deadline) {
    return new Date(Date.parse(`${deadline}T23:59:59Z`) + RSVP_LIMITS.afterDeadlineDays * 86400000).toISOString();
  }
  return new Date(now.getTime() + RSVP_LIMITS.defaultTtlDays * 86400000).toISOString();
}

/** Replies are accepted until the end of the deadline day (UTC). */
export function repliesOpen(settings, now = new Date()) {
  if (!settings?.deadline) return true;
  return now.getTime() <= Date.parse(`${settings.deadline}T23:59:59Z`);
}

// --- Repository ---------------------------------------------------------------------

const toSettings = (row) =>
  row
    ? {
        slug: row.slug,
        deadline: row.deadline,
        questions: { ...DEFAULT_QUESTIONS, ...JSON.parse(row.questions) },
        updatedAt: row.updated_at,
      }
    : null;

const toInvite = (row) =>
  row
    ? {
        id: row.id,
        workspaceId: row.workspace_id,
        targetType: row.target_type,
        targetId: row.target_id,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        revoked: Boolean(row.revoked_at),
        openedAt: row.last_opened_at,
        respondedAt: row.responded_at,
      }
    : null;

export function createRsvpRepository(db, sync) {
  db.exec(RSVP_SCHEMA);

  const statements = {
    settings: db.prepare('SELECT * FROM rsvp_settings WHERE workspace_id = ?'),
    settingsBySlug: db.prepare('SELECT * FROM rsvp_settings WHERE slug = ?'),
    upsertSettings: db.prepare(
      `INSERT INTO rsvp_settings (workspace_id, slug, deadline, questions, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (workspace_id) DO UPDATE SET slug = excluded.slug, deadline = excluded.deadline,
         questions = excluded.questions, updated_at = excluded.updated_at`
    ),
    insertInvite: db.prepare(
      `INSERT INTO rsvp_invites (id, workspace_id, target_type, target_id, token_hash, code_hash, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ),
    revokeForTarget: db.prepare(
      `UPDATE rsvp_invites SET revoked_at = ? WHERE workspace_id = ? AND target_type = ? AND target_id = ? AND revoked_at IS NULL`
    ),
    revokeOne: db.prepare('UPDATE rsvp_invites SET revoked_at = ? WHERE workspace_id = ? AND id = ? AND revoked_at IS NULL'),
    list: db.prepare('SELECT * FROM rsvp_invites WHERE workspace_id = ? AND revoked_at IS NULL ORDER BY created_at'),
    byToken: db.prepare('SELECT * FROM rsvp_invites WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?'),
    byCode: db.prepare(
      'SELECT * FROM rsvp_invites WHERE workspace_id = ? AND code_hash = ? AND revoked_at IS NULL AND expires_at > ?'
    ),
    touchOpened: db.prepare('UPDATE rsvp_invites SET last_opened_at = ? WHERE id = ?'),
    touchResponded: db.prepare('UPDATE rsvp_invites SET responded_at = ? WHERE id = ?'),
  };

  return {
    getSettings(workspaceId) {
      return toSettings(statements.settings.get(workspaceId));
    },

    /** Resolves `{ settings }` or `{ error: 'slug_taken' }`. Fields left out keep their value. */
    saveSettings(workspaceId, patch, { now = new Date() } = {}) {
      const current = this.getSettings(workspaceId) ?? { slug: null, deadline: null, questions: DEFAULT_QUESTIONS };
      const next = {
        slug: patch.slug === undefined ? current.slug : patch.slug,
        deadline: patch.deadline === undefined ? current.deadline : patch.deadline,
        questions: { ...current.questions, ...(patch.questions ?? {}) },
      };
      const owner = next.slug ? statements.settingsBySlug.get(next.slug) : null;
      if (owner && owner.workspace_id !== workspaceId) return { error: 'slug_taken' };
      statements.upsertSettings.run(workspaceId, next.slug, next.deadline, JSON.stringify(next.questions), now.toISOString());
      return { settings: this.getSettings(workspaceId) };
    },

    /** The workspace whose RSVP page lives at `slug`, or null. */
    workspaceForSlug(slug) {
      return statements.settingsBySlug.get(String(slug ?? ''))?.workspace_id ?? null;
    },

    /**
     * Issue invites for targets, replacing any live invite each already has.
     * The only time the raw token and code exist: they are returned, not kept.
     */
    createInvites(workspaceId, targets, { now = new Date() } = {}) {
      const settings = this.getSettings(workspaceId);
      const expiresAt = expiryFor(settings?.deadline, now);
      const created = [];
      db.exec('BEGIN IMMEDIATE');
      try {
        for (const { type, id } of targets) {
          statements.revokeForTarget.run(now.toISOString(), workspaceId, type, id);
          const token = randomBytes(16).toString('base64url');
          const code = generateCode();
          const inviteId = `rsvpinv_${randomUUID()}`;
          statements.insertInvite.run(inviteId, workspaceId, type, id, tokenHash(token), codeHash(workspaceId, code), now.toISOString(), expiresAt);
          created.push({ inviteId, targetType: type, targetId: id, token, code: formatCode(code), expiresAt });
        }
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      return created;
    },

    revoke(workspaceId, inviteId, { now = new Date() } = {}) {
      return statements.revokeOne.run(now.toISOString(), workspaceId, inviteId).changes > 0;
    },

    listInvites(workspaceId) {
      return statements.list.all(workspaceId).map(toInvite);
    },

    findByToken(token, { now = new Date() } = {}) {
      if (typeof token !== 'string' || token.length < 16 || token.length > 64) return null;
      return toInvite(statements.byToken.get(tokenHash(token), now.toISOString()));
    },

    findByCode(workspaceId, code, { now = new Date() } = {}) {
      if (normaliseCode(code).length !== CODE_LENGTH) return null;
      return toInvite(statements.byCode.get(workspaceId, codeHash(workspaceId, code), now.toISOString()));
    },

    markOpened(invite, { now = new Date() } = {}) {
      statements.touchOpened.run(now.toISOString(), invite.id);
    },

    /**
     * Everything the form needs for an invite: the wedding, the settings, and
     * only the invite's own guests (W2), by first name.
     */
    formContext(invite) {
      const wedding = sync.liveRecords(invite.workspaceId, 'wedding')[0]?.data ?? null;
      const settings = this.getSettings(invite.workspaceId) ?? { deadline: null, questions: DEFAULT_QUESTIONS };
      const guests = sync
        .liveRecords(invite.workspaceId, 'guests')
        .map((record) => record.data)
        .filter((guest) =>
          invite.targetType === 'household' ? guest?.householdId === invite.targetId : guest?.id === invite.targetId
        )
        .map((guest) => ({
          id: guest.id,
          firstName: guest.firstName || 'Guest',
          plusOneAllowed: guest.plusOneStatus === 'allowed' || guest.plusOneStatus === 'confirmed',
        }));
      const previous = sync.getRecord(invite.workspaceId, 'rsvpResponses', `rsvp_${invite.id}`)?.data ?? null;
      return { wedding, settings, guests, previous };
    },

    /**
     * Validate a submitted form against the invite's own guests and write the
     * reply. Unknown guest ids in the form are ignored (W2). Resolves
     * `{ response }` or `{ errors }`.
     */
    submit(invite, form, { now = new Date() } = {}) {
      const { settings, guests } = this.formContext(invite);
      const { questions } = settings;
      const errors = {};
      const answers = guests.map((guest) => {
        const attending = form[`attending_${guest.id}`];
        if (attending !== 'yes' && attending !== 'no') errors[guest.id] = 'Please choose yes or no.';
        const meal = form[`meal_${guest.id}`] ?? '';
        if (questions.meals && attending === 'yes' && meal && !MEAL_CHOICES.some((choice) => choice.value === meal)) {
          errors[guest.id] = 'Please pick a meal from the list.';
        }
        const dietary = String(form[`dietary_${guest.id}`] ?? '').trim();
        if (dietary.length > RSVP_LIMITS.dietaryChars) errors[guest.id] = 'Dietary notes are too long.';
        const plusOneName = String(form[`plusone_${guest.id}`] ?? '').trim();
        if (plusOneName.length > RSVP_LIMITS.plusOneNameChars) errors[guest.id] = 'That name is too long.';
        return {
          guestId: guest.id,
          attending: attending === 'yes',
          meal: questions.meals && attending === 'yes' && meal ? meal : null,
          dietary: questions.dietary && attending === 'yes' ? dietary : '',
          plusOneName: questions.plusOnes && guest.plusOneAllowed && attending === 'yes' ? plusOneName : '',
        };
      });
      const message = questions.message ? String(form.message ?? '').trim() : '';
      if (message.length > RSVP_LIMITS.messageChars) errors.message = 'The message is too long.';
      if (!guests.length) errors.form = 'There is nobody on this invitation yet.';
      if (Object.keys(errors).length) return { errors };

      const id = `rsvp_${invite.id}`;
      const response = {
        id,
        inviteId: invite.id,
        targetType: invite.targetType,
        targetId: invite.targetId,
        guests: answers,
        message,
        submittedAt: now.toISOString(),
      };
      const existing = sync.getRecord(invite.workspaceId, 'rsvpResponses', id);
      const result = sync.push(
        invite.workspaceId,
        `rsvp:${invite.id}`,
        [
          {
            mutationId: `mut_${randomUUID().replace(/-/g, '')}`,
            collection: 'rsvpResponses',
            id,
            op: 'upsert',
            baseVersion: existing?.version ?? 0,
            data: response,
          },
        ],
        { asServer: true }
      );
      if (!result.applied.length) return { errors: { form: 'Your reply could not be saved. Please try again.' } };
      statements.touchResponded.run(now.toISOString(), invite.id);
      return { response };
    },
  };
}
