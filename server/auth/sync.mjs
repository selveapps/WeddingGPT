/**
 * Workspace sync (design M1, section 4; slice A2).
 *
 * Each record (one task, one guest) syncs on its own. The server orders every
 * accepted write with an increasing `seq`, and devices pull "everything after
 * the last seq I saw" - device clocks are never used for ordering.
 *
 * A push carries the version the device last saw (`baseVersion`). If someone
 * else changed the record first, the later push still wins (it is that
 * person's latest intent) but the overwritten copy comes back in `conflicts`,
 * so the app can offer to restore it: no edit is lost silently (T11).
 *
 * Deletes are tombstones: the row stays, with its contents removed, so other
 * devices learn about the delete. Tombstones are purged once they are old and
 * every member has pulled past them.
 */

export const SYNC_COLLECTIONS = [
  'wedding',
  'budget',
  'tasks',
  'taskCategories',
  'expenses',
  'budgetCategories',
  'guests',
  'households',
  'vendors',
  'notificationPreferences',
  'rsvpResponses',
  'website',
];

/**
 * Collections only the server writes: guests' RSVP replies (design E §2).
 * A device may read them but never push to them, so a reply can only come
 * from the guest's own link and never overwrites the couple's edits.
 */
export const SERVER_WRITTEN_COLLECTIONS = ['rsvpResponses'];

export const SYNC_LIMITS = {
  mutationsPerPush: 100,
  recordBytes: 64 * 1024,
  requestBytes: 1024 * 1024,
  pullDefault: 500,
  pullMax: 500,
  recordsPerWorkspace: 20000,
  tombstoneDays: 90,
  /** A retry older than this is not a retry; its idempotency entry can go. */
  mutationDays: 30,
};

export const Op = {
  UPSERT: 'upsert',
  DELETE: 'delete',
};

export const SYNC_SCHEMA = `
  CREATE TABLE IF NOT EXISTS records (
    workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    collection    TEXT NOT NULL,
    id            TEXT NOT NULL,
    data          TEXT,
    version       INTEGER NOT NULL,
    updated_at    TEXT NOT NULL,
    updated_by    TEXT NOT NULL,
    deleted_at    TEXT,
    seq           INTEGER NOT NULL,
    PRIMARY KEY (workspace_id, collection, id)
  );
  CREATE INDEX IF NOT EXISTS records_workspace_seq ON records(workspace_id, seq);

  CREATE TABLE IF NOT EXISTS mutations (
    workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    mutation_id   TEXT NOT NULL,
    version       INTEGER NOT NULL,
    seq           INTEGER NOT NULL,
    applied_at    TEXT NOT NULL,
    PRIMARY KEY (workspace_id, mutation_id)
  );

  -- How far each member has pulled; tombstones are purged only behind everyone.
  CREATE TABLE IF NOT EXISTS sync_cursors (
    workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id       TEXT NOT NULL,
    seq           INTEGER NOT NULL,
    PRIMARY KEY (workspace_id, user_id)
  );

  -- One server-wide sequence. Not MAX(seq) + 1: purging the newest tombstone
  -- would then hand out a seq that devices have already pulled past.
  CREATE TABLE IF NOT EXISTS counters (
    name   TEXT PRIMARY KEY,
    value  INTEGER NOT NULL
  );
  INSERT OR IGNORE INTO counters (name, value) VALUES ('seq', 0);
`;

const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const MUTATION_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/**
 * Check one mutation's shape. Returns null when it is fine, or an error code.
 * A record's own `id` field may not point at a different record (T2).
 */
export function validateMutation(mutation) {
  if (!isPlainObject(mutation)) return 'invalid';
  const { mutationId, collection, id, op, baseVersion, data } = mutation;
  if (typeof mutationId !== 'string' || !MUTATION_ID_PATTERN.test(mutationId)) return 'invalid';
  if (!SYNC_COLLECTIONS.includes(collection)) return 'unknown_collection';
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) return 'invalid';
  if (op !== Op.UPSERT && op !== Op.DELETE) return 'invalid';
  if (baseVersion !== null && baseVersion !== undefined && !(Number.isInteger(baseVersion) && baseVersion >= 0)) {
    return 'invalid';
  }
  if (op === Op.UPSERT) {
    if (!isPlainObject(data)) return 'invalid';
    if (data.id !== undefined && data.id !== id) return 'invalid';
    if (Buffer.byteLength(JSON.stringify(data)) > SYNC_LIMITS.recordBytes) return 'too_large';
  }
  return null;
}

function toRecord(row) {
  return {
    collection: row.collection,
    id: row.id,
    version: row.version,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    deletedAt: row.deleted_at,
    data: row.data === null ? null : JSON.parse(row.data),
  };
}

export function createSyncRepository(db) {
  db.exec(SYNC_SCHEMA);

  const statements = {
    nextSeq: db.prepare("UPDATE counters SET value = value + 1 WHERE name = 'seq' RETURNING value"),
    findRecord: db.prepare('SELECT * FROM records WHERE workspace_id = ? AND collection = ? AND id = ?'),
    liveInCollection: db.prepare(
      'SELECT * FROM records WHERE workspace_id = ? AND collection = ? AND deleted_at IS NULL ORDER BY seq'
    ),
    upsertRecord: db.prepare(
      `INSERT INTO records (workspace_id, collection, id, data, version, updated_at, updated_by, deleted_at, seq)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (workspace_id, collection, id) DO UPDATE SET
         data = excluded.data, version = excluded.version, updated_at = excluded.updated_at,
         updated_by = excluded.updated_by, deleted_at = excluded.deleted_at, seq = excluded.seq`
    ),
    countLive: db.prepare('SELECT COUNT(*) AS n FROM records WHERE workspace_id = ? AND deleted_at IS NULL'),
    findMutation: db.prepare('SELECT * FROM mutations WHERE workspace_id = ? AND mutation_id = ?'),
    insertMutation: db.prepare(
      'INSERT INTO mutations (workspace_id, mutation_id, version, seq, applied_at) VALUES (?, ?, ?, ?, ?)'
    ),
    pull: db.prepare('SELECT * FROM records WHERE workspace_id = ? AND seq > ? ORDER BY seq LIMIT ?'),
    saveCursor: db.prepare(
      `INSERT INTO sync_cursors (workspace_id, user_id, seq) VALUES (?, ?, ?)
       ON CONFLICT (workspace_id, user_id) DO UPDATE SET seq = MAX(seq, excluded.seq)`
    ),
    slowestCursor: db.prepare(
      `SELECT MIN(COALESCE(sync_cursors.seq, 0)) AS seq FROM memberships
       LEFT JOIN sync_cursors ON sync_cursors.workspace_id = memberships.workspace_id
         AND sync_cursors.user_id = memberships.user_id
       WHERE memberships.workspace_id = ?`
    ),
    purgeTombstones: db.prepare(
      'DELETE FROM records WHERE workspace_id = ? AND deleted_at IS NOT NULL AND deleted_at < ? AND seq <= ?'
    ),
    workspacesWithTombstones: db.prepare(
      'SELECT DISTINCT workspace_id FROM records WHERE deleted_at IS NOT NULL AND deleted_at < ?'
    ),
    purgeMutations: db.prepare('DELETE FROM mutations WHERE applied_at < ?'),
  };

  const daysBefore = (now, days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  function applyOne(workspaceId, userId, mutation, now) {
    const { mutationId, collection, id, op, data } = mutation;
    const baseVersion = mutation.baseVersion ?? 0;

    const seen = statements.findMutation.get(workspaceId, mutationId);
    if (seen) return { applied: { mutationId, version: seen.version, seq: seen.seq } };

    const existing = statements.findRecord.get(workspaceId, collection, id);
    const isNewLiveRecord = op === Op.UPSERT && (!existing || existing.deleted_at);
    if (isNewLiveRecord && statements.countLive.get(workspaceId).n >= SYNC_LIMITS.recordsPerWorkspace) {
      return { rejected: { mutationId, error: 'quota_exceeded' } };
    }

    const version = (existing?.version ?? 0) + 1;
    const seq = statements.nextSeq.get().value;
    statements.upsertRecord.run(
      workspaceId,
      collection,
      id,
      op === Op.UPSERT ? JSON.stringify(data) : null,
      version,
      now,
      userId,
      op === Op.DELETE ? now : null,
      seq
    );
    statements.insertMutation.run(workspaceId, mutationId, version, seq, now);

    const result = { applied: { mutationId, version, seq } };
    if (existing && existing.version !== baseVersion) {
      result.conflict = {
        mutationId,
        overwritten: {
          version: existing.version,
          updatedBy: existing.updated_by,
          updatedAt: existing.updated_at,
          deletedAt: existing.deleted_at,
          data: existing.data === null ? null : JSON.parse(existing.data),
        },
      };
    }
    return result;
  }

  return {
    /**
     * Apply a batch in one transaction. Invalid mutations are rejected one by
     * one; the rest still apply.
     */
    push(workspaceId, userId, mutations, { asServer = false } = {}) {
      const applied = [];
      const conflicts = [];
      const rejected = [];
      const now = new Date().toISOString();

      db.exec('BEGIN IMMEDIATE');
      try {
        for (const mutation of mutations) {
          const error =
            validateMutation(mutation) ??
            (!asServer && SERVER_WRITTEN_COLLECTIONS.includes(mutation.collection) ? 'read_only' : null);
          if (error) {
            rejected.push({ mutationId: typeof mutation?.mutationId === 'string' ? mutation.mutationId : null, error });
            continue;
          }
          const result = applyOne(workspaceId, userId, mutation, now);
          if (result.applied) applied.push(result.applied);
          if (result.conflict) conflicts.push(result.conflict);
          if (result.rejected) rejected.push(result.rejected);
        }
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }

      return { applied, conflicts, rejected };
    },

    /** One live record's data, or null. For the server's own pages (RSVP). */
    getRecord(workspaceId, collection, id) {
      const row = statements.findRecord.get(workspaceId, collection, id);
      return row && !row.deleted_at ? { ...toRecord(row) } : null;
    },

    /** Every live record in a collection, oldest first. */
    liveRecords(workspaceId, collection) {
      return statements.liveInCollection.all(workspaceId, collection).map(toRecord);
    },

    /** Records changed after `since`, oldest first, and where to continue. */
    pull(workspaceId, userId, { since = 0, limit = SYNC_LIMITS.pullDefault } = {}) {
      const rows = statements.pull.all(workspaceId, since, limit + 1);
      const hasMore = rows.length > limit;
      const page = hasMore ? rows.slice(0, limit) : rows;
      const cursor = page.length ? page[page.length - 1].seq : since;
      statements.saveCursor.run(workspaceId, userId, cursor);
      return { records: page.map(toRecord), cursor, hasMore };
    },

    /** Delete old tombstones that every member has already pulled past. */
    purgeTombstones(workspaceId, { now = new Date() } = {}) {
      const before = daysBefore(now, SYNC_LIMITS.tombstoneDays);
      const slowest = statements.slowestCursor.get(workspaceId)?.seq ?? 0;
      return statements.purgeTombstones.run(workspaceId, before, slowest).changes;
    },

    /** Housekeeping for every workspace: old tombstones and old idempotency entries. */
    compact({ now = new Date() } = {}) {
      const before = daysBefore(now, SYNC_LIMITS.tombstoneDays);
      let tombstones = 0;
      for (const { workspace_id: workspaceId } of statements.workspacesWithTombstones.all(before)) {
        tombstones += this.purgeTombstones(workspaceId, { now });
      }
      const mutations = statements.purgeMutations.run(daysBefore(now, SYNC_LIMITS.mutationDays)).changes;
      return { tombstones, mutations };
    },
  };
}

/** Parse `since` and `limit` from a pull query string. Returns null if invalid. */
export function parsePullQuery(query = {}) {
  const since = query.since === undefined ? 0 : Number(query.since);
  const limit = query.limit === undefined ? SYNC_LIMITS.pullDefault : Number(query.limit);
  if (!Number.isInteger(since) || since < 0) return null;
  if (!Number.isInteger(limit) || limit < 1 || limit > SYNC_LIMITS.pullMax) return null;
  return { since, limit };
}
