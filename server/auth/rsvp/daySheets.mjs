import { createHash, randomBytes, randomUUID } from 'node:crypto';

/**
 * Day-of sheets for vendors (workstream F, slice F3).
 *
 * A read-only page for one event - when and where, the run of show, and the
 * people to call - behind a link the couple sends to a vendor. Threats D1-D6
 * are in docs/planning/F-multi-event-guests.md. In short: the token is 128-bit
 * random and stored only as a hash (D1); the page shows only the event, its
 * run of show, the couple's names and the contacts the couple ticked (D2);
 * links are revocable and expire a week after the event (D5); a sheet reads
 * only its own wedding's records (D6).
 */

export const DAY_SHEET_LIMITS = {
  perWedding: 50,
  labelChars: 80,
  contacts: 10,
  /** After the event; without an event date, from when the link was made. */
  daysAfterEvent: 7,
  daysWithoutDate: 120,
};

const ID = /^[A-Za-z0-9_-]{1,128}$/;
const DAY = 24 * 60 * 60 * 1000;

export const DAY_SHEET_SCHEMA = `
  CREATE TABLE IF NOT EXISTS day_sheets (
    id              TEXT PRIMARY KEY,
    workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    event_id        TEXT,
    label           TEXT NOT NULL,
    contact_ids     TEXT NOT NULL,
    token_hash      TEXT NOT NULL UNIQUE,
    created_at      TEXT NOT NULL,
    expires_at      TEXT NOT NULL,
    revoked_at      TEXT,
    last_opened_at  TEXT
  );
  CREATE INDEX IF NOT EXISTS day_sheets_workspace ON day_sheets(workspace_id);
`;

const tokenHash = (token) => createHash('sha256').update(`daysheet:${token}`).digest('hex');

/** Returns `{ field: code }` for a bad request, or null. */
export function validateDaySheet({ eventId = null, label, contactIds = [] } = {}) {
  const fields = {};
  if (eventId !== null && (typeof eventId !== 'string' || !ID.test(eventId))) fields.eventId = 'invalid';
  if (typeof label !== 'string' || !label.trim()) fields.label = 'required';
  else if (label.trim().length > DAY_SHEET_LIMITS.labelChars) fields.label = 'too_long';
  if (
    !Array.isArray(contactIds) ||
    contactIds.length > DAY_SHEET_LIMITS.contacts ||
    !contactIds.every((id) => typeof id === 'string' && ID.test(id))
  ) {
    fields.contactIds = 'invalid';
  }
  return Object.keys(fields).length ? fields : null;
}

/** A week after the event's (or the wedding's) date, else a few months from now. */
export function expiryFor(date, now = new Date()) {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date))) {
    const end = new Date(`${date}T23:59:59Z`).getTime() + DAY_SHEET_LIMITS.daysAfterEvent * DAY;
    if (end > now.getTime()) return new Date(end).toISOString();
  }
  return new Date(now.getTime() + DAY_SHEET_LIMITS.daysWithoutDate * DAY).toISOString();
}

const toSheet = (row) =>
  row
    ? {
        id: row.id,
        workspaceId: row.workspace_id,
        eventId: row.event_id,
        label: row.label,
        contactIds: JSON.parse(row.contact_ids),
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        revokedAt: row.revoked_at,
        lastOpenedAt: row.last_opened_at,
      }
    : null;

/** What the couple's app sees of a link: never the token or its hash. */
export const publicSheet = ({ workspaceId: _ws, ...sheet }) => sheet;

export function createDaySheetRepository(db, sync) {
  db.exec(DAY_SHEET_SCHEMA);
  const statements = {
    insert: db.prepare(
      `INSERT INTO day_sheets (id, workspace_id, event_id, label, contact_ids, token_hash, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ),
    count: db.prepare('SELECT COUNT(*) AS n FROM day_sheets WHERE workspace_id = ? AND revoked_at IS NULL'),
    list: db.prepare('SELECT * FROM day_sheets WHERE workspace_id = ? ORDER BY created_at DESC, id'),
    byToken: db.prepare('SELECT * FROM day_sheets WHERE token_hash = ?'),
    revoke: db.prepare(
      'UPDATE day_sheets SET revoked_at = ? WHERE workspace_id = ? AND id = ? AND revoked_at IS NULL'
    ),
    touch: db.prepare('UPDATE day_sheets SET last_opened_at = ? WHERE id = ?'),
  };

  const live = (workspaceId, collection) =>
    sync.liveRecords(workspaceId, collection).map((record) => record.data);

  return {
    /**
     * Make a link. Resolves `{ sheet, token }` - the only time the token
     * exists - or `{ error }`: 'limit_reached' or 'event_not_found'.
     */
    create(workspaceId, { eventId = null, label, contactIds = [] }, { now = new Date() } = {}) {
      if (statements.count.get(workspaceId).n >= DAY_SHEET_LIMITS.perWedding)
        return { error: 'limit_reached' };
      const event = eventId ? live(workspaceId, 'events').find((entry) => entry?.id === eventId) : null;
      if (eventId && !event) return { error: 'event_not_found' };
      const wedding = live(workspaceId, 'wedding')[0] ?? null;
      const token = randomBytes(16).toString('base64url');
      const id = `sheet_${randomUUID()}`;
      statements.insert.run(
        id,
        workspaceId,
        eventId,
        label.trim(),
        JSON.stringify([...new Set(contactIds)]),
        tokenHash(token),
        now.toISOString(),
        expiryFor(event ? event.date : wedding?.date, now)
      );
      return { sheet: toSheet(statements.list.all(workspaceId).find((row) => row.id === id)), token };
    },

    list(workspaceId) {
      return statements.list.all(workspaceId).map(toSheet);
    },

    revoke(workspaceId, sheetId, { now = new Date() } = {}) {
      return statements.revoke.run(now.toISOString(), workspaceId, sheetId).changes > 0;
    },

    /** The live sheet behind a token, or null (unknown, revoked or expired all look the same). */
    findByToken(token, { now = new Date() } = {}) {
      if (typeof token !== 'string' || token.length > 64) return null;
      const sheet = toSheet(statements.byToken.get(tokenHash(token)));
      if (!sheet || sheet.revokedAt || sheet.expiresAt <= now.toISOString()) return null;
      return sheet;
    },

    markOpened(sheet, { now = new Date() } = {}) {
      statements.touch.run(now.toISOString(), sheet.id);
    },

    /**
     * Everything the page shows, read from the sheet's own wedding only (D6)
     * and trimmed to what a vendor needs (D2). Null when its event is gone.
     */
    content(sheet) {
      const wedding = live(sheet.workspaceId, 'wedding')[0] ?? null;
      let event = null;
      if (sheet.eventId) {
        event = live(sheet.workspaceId, 'events').find((entry) => entry?.id === sheet.eventId) ?? null;
        if (!event) return null;
      }
      const items = live(sheet.workspaceId, 'runOfShow')
        .filter((item) => item && (item.eventId ?? null) === (sheet.eventId ?? null))
        .filter((item) => Number.isFinite(item.start))
        .sort((a, b) => a.start - b.start)
        .map((item) => ({
          title: String(item.title ?? ''),
          start: item.start,
          durationMin: Number.isFinite(item.durationMin) ? item.durationMin : 0,
          location: String(item.location ?? ''),
          owner: String(item.owner ?? ''),
        }));
      const chosen = new Set(sheet.contactIds);
      const contacts = live(sheet.workspaceId, 'partyMembers')
        .filter((member) => member && chosen.has(member.id))
        .map((member) => ({
          name: String(member.name ?? ''),
          roleKey: String(member.roleKey ?? ''),
          phone: String(member.phone ?? ''),
        }));
      return {
        label: sheet.label,
        couple: { ownerName: wedding?.ownerName ?? '', partnerName: wedding?.partnerName ?? '' },
        when: event
          ? {
              name: String(event.name ?? '') || 'Event',
              date: event.date ?? null,
              startTime: event.startTime ?? null,
              endTime: event.endTime ?? null,
              venueName: String(event.venueName ?? ''),
              address: String(event.address ?? ''),
              dressCode: String(event.dressCode ?? ''),
            }
          : {
              name: 'The wedding day',
              date: wedding?.dateType === 'exact' ? (wedding?.date ?? null) : null,
              startTime: null,
              endTime: null,
              venueName: String(wedding?.venueName ?? ''),
              address: '',
              dressCode: '',
            },
        items,
        contacts,
      };
    },
  };
}
