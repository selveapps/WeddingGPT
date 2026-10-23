/**
 * Backups of the plan on this phone (graduated from the Labs backup, rebuilt
 * on the real sync collections).
 *
 * A backup holds every collection that syncs (see `services/sync/collections`)
 * as it is stored: `{ byId, allIds }` for many records, one record or null
 * for the rest. Restoring *replaces* the phone's plan with the backup rather
 * than merging, so something deleted after the backup never comes back half
 * way; the screen asks first and offers a fresh backup of what is there now.
 *
 * A backup file is untrusted input - it may be damaged, edited, or not ours -
 * so `readBackup` checks its whole shape before anything is restored.
 * Personal settings that never sync (reminders, assistant chats) are not in it.
 */

export const BACKUP_FORMAT = 'weddinggpt-backup';
export const BACKUP_VERSION = 1;

export const BACKUP_LIMITS = {
  /** The largest backup that is read at all, in characters. */
  textChars: 5 * 1024 * 1024,
  recordsPerCollection: 20000,
};

/** Same rule as the sync server's record ids. */
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const FORBIDDEN_IDS = new Set(['__proto__', 'constructor', 'prototype']);
const isId = (id) => typeof id === 'string' && ID_PATTERN.test(id) && !FORBIDDEN_IDS.has(id);
const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/** FNV-1a over the content, as 8 hex characters. Detects damage, not tampering. */
export function checksum(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * The backup file's text. `slices` are `[{ collection, kind, value }]`;
 * `kind` is 'many' or 'one'.
 */
export function buildBackup(slices = [], { createdAt = new Date().toISOString() } = {}) {
  const collections = {};
  for (const { collection, value } of slices) collections[collection] = value ?? null;
  const content = JSON.stringify(collections);
  return JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt,
    checksum: checksum(content),
    collections,
  });
}

/** `{ byId, allIds }` rebuilt from only valid records, or an error message. */
function readMany(value, label) {
  if (value === null || value === undefined) return { value: { byId: {}, allIds: [] } };
  if (!isRecord(value) || !isRecord(value.byId) || !Array.isArray(value.allIds)) {
    return { error: `The ${label} in this backup are damaged.` };
  }
  if (value.allIds.length > BACKUP_LIMITS.recordsPerCollection)
    return { error: `This backup has too many ${label}.` };
  const byId = {};
  const allIds = [];
  for (const id of value.allIds) {
    const record = Object.prototype.hasOwnProperty.call(value.byId, id) ? value.byId[id] : undefined;
    if (
      !isId(id) ||
      !isRecord(record) ||
      record.id !== id ||
      Object.prototype.hasOwnProperty.call(byId, id)
    ) {
      return { error: `The ${label} in this backup are damaged.` };
    }
    byId[id] = record;
    allIds.push(id);
  }
  return { value: { byId, allIds } };
}

function readOne(value, label) {
  if (value === null || value === undefined) return { value: null };
  if (!isRecord(value) || !isId(value.id)) return { error: `The ${label} in this backup is damaged.` };
  return { value };
}

/**
 * Check a backup's text. `known` is `[{ collection, kind, label }]`, the
 * collections this version of the app restores. Resolves
 * `{ ok: true, createdAt, collections, counts }` or `{ ok: false, error }`.
 * Collections the app does not know (from a newer version) are left out.
 */
export function readBackup(text, known = []) {
  const source = String(text ?? '').trim();
  if (!source) return { ok: false, error: 'Choose a backup file, or paste one.' };
  if (source.length > BACKUP_LIMITS.textChars)
    return { ok: false, error: 'That file is too large to be a backup.' };

  let raw;
  try {
    raw = JSON.parse(source);
  } catch {
    return { ok: false, error: 'That is not a WeddingGPT backup.' };
  }
  if (!isRecord(raw) || raw.format !== BACKUP_FORMAT || !isRecord(raw.collections)) {
    return { ok: false, error: 'That is not a WeddingGPT backup.' };
  }
  if (!Number.isInteger(raw.version) || raw.version > BACKUP_VERSION) {
    return { ok: false, error: 'This backup was made by a newer version of the app. Update the app first.' };
  }
  if (raw.checksum !== checksum(JSON.stringify(raw.collections))) {
    return { ok: false, error: 'This backup has been changed or cut off since it was made.' };
  }

  const collections = {};
  const counts = [];
  for (const { collection, kind, label } of known) {
    const read =
      kind === 'one'
        ? readOne(raw.collections[collection], label)
        : readMany(raw.collections[collection], label);
    if (read.error) return { ok: false, error: read.error };
    collections[collection] = read.value;
    counts.push({
      collection,
      label,
      count: kind === 'one' ? (read.value ? 1 : 0) : read.value.allIds.length,
    });
  }
  if (!collections.wedding) return { ok: false, error: 'This backup has no wedding in it.' };

  return {
    ok: true,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : null,
    collections,
    counts,
  };
}
