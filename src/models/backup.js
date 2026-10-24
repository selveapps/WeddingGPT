/**
 * Backups of the plan on this phone.
 *
 * A backup holds every collection that syncs as stored: `{ byId, allIds }` for
 * many records, one record or null for the rest. Restoring *replaces* the
 * phone's plan with the backup rather than merging.
 *
 * A backup file is untrusted input - validate shape before restore.
 */

export const BACKUP_FORMAT = 'weddinggpt-backup';
export const BACKUP_VERSION = 1;

export const BACKUP_LIMITS = {
  textChars: 5 * 1024 * 1024,
  recordsPerCollection: 20000,
  historyEntries: 50,
};

export const BackupJobStatus = {
  IDLE: 'idle',
  COLLECTING: 'collecting',
  SERIALIZING: 'serializing',
  WRITING: 'writing',
  DONE: 'done',
  FAILED: 'failed',
};

export const BackupJobStatusMeta = {
  idle: { label: 'Ready', tone: 'neutral' },
  collecting: { label: 'Collecting data…', tone: 'info' },
  serializing: { label: 'Building file…', tone: 'info' },
  writing: { label: 'Saving…', tone: 'info' },
  done: { label: 'Complete', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
};

export const RestoreStep = {
  PICK: 'pick',
  VALIDATE: 'validate',
  PREVIEW: 'preview',
  CONFIRM: 'confirm',
  APPLYING: 'applying',
  DONE: 'done',
  ERROR: 'error',
};

const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const FORBIDDEN_IDS = new Set(['__proto__', 'constructor', 'prototype']);
export const isId = (id) => typeof id === 'string' && ID_PATTERN.test(id) && !FORBIDDEN_IDS.has(id);
export const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

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
 * Build backup JSON string from slices: [{ collection, kind, value }]
 * kind is 'many' | 'one'
 */
export function buildBackup(slices = [], { createdAt = new Date().toISOString(), label = '', deviceName = '' } = {}) {
  const collections = {};
  for (const { collection, value } of slices) collections[collection] = value ?? null;
  const content = JSON.stringify(collections);
  return JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt,
    label: label || undefined,
    deviceName: deviceName || undefined,
    checksum: checksum(content),
    collections,
  });
}

function readMany(value, label) {
  if (value === null || value === undefined) return { value: { byId: {}, allIds: [] } };
  if (!isRecord(value) || !isRecord(value.byId) || !Array.isArray(value.allIds)) {
    return { error: `The ${label} collection is not a valid list.` };
  }
  if (value.allIds.length > BACKUP_LIMITS.recordsPerCollection) {
    return { error: `The ${label} collection is too large.` };
  }
  const byId = {};
  const allIds = [];
  for (const id of value.allIds) {
    if (!isId(id)) return { error: `Invalid id in ${label}.` };
    const rec = value.byId[id];
    if (!isRecord(rec)) return { error: `Invalid record in ${label}.` };
    byId[id] = rec;
    allIds.push(id);
  }
  return { value: { byId, allIds } };
}

function readOne(value, label) {
  if (value === null || value === undefined) return { value: null };
  if (!isRecord(value)) return { error: `The ${label} record is invalid.` };
  return { value };
}

/**
 * Parse and validate a backup file string.
 * Returns { ok, error?, data?, counts?, createdAt?, version? }
 */
export function readBackup(text) {
  if (typeof text !== 'string') return { ok: false, error: 'Backup must be text.' };
  if (text.length > BACKUP_LIMITS.textChars) return { ok: false, error: 'Backup file is too large.' };
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Backup is not valid JSON.' };
  }
  if (!isRecord(parsed)) return { ok: false, error: 'Backup root is invalid.' };
  if (parsed.format !== BACKUP_FORMAT) return { ok: false, error: 'Not a WeddingGPT backup file.' };
  if (parsed.version !== BACKUP_VERSION) return { ok: false, error: `Unsupported backup version (${parsed.version}).` };
  if (!isRecord(parsed.collections)) return { ok: false, error: 'Backup has no collections.' };

  const content = JSON.stringify(parsed.collections);
  if (parsed.checksum && parsed.checksum !== checksum(content)) {
    return { ok: false, error: 'Backup checksum does not match — file may be damaged.' };
  }

  const collections = {};
  const counts = [];
  let totalRecords = 0;

  for (const [name, value] of Object.entries(parsed.collections)) {
    if (typeof name !== 'string' || !name) {
      return { ok: false, error: 'Invalid collection name.' };
    }
    // Heuristic: objects with byId+allIds are "many"
    const isMany = isRecord(value) && isRecord(value?.byId) && Array.isArray(value?.allIds);
    const result = isMany || value === null || value === undefined
      ? (isMany || value == null ? readMany(value, name) : readOne(value, name))
      : readOne(value, name);
    // Prefer many when shape matches
    const manyTry = readMany(value, name);
    const oneTry = readOne(value, name);
    let chosen;
    if (!manyTry.error && (isMany || value == null)) chosen = manyTry;
    else if (!oneTry.error) chosen = oneTry;
    else chosen = manyTry.error ? oneTry : manyTry;
    if (chosen.error) return { ok: false, error: chosen.error };
    collections[name] = chosen.value;
    const count = chosen.value && chosen.value.allIds
      ? chosen.value.allIds.length
      : chosen.value ? 1 : 0;
    counts.push({ collection: name, count });
    totalRecords += count;
  }

  return {
    ok: true,
    data: {
      format: parsed.format,
      version: parsed.version,
      createdAt: parsed.createdAt || null,
      label: parsed.label || null,
      deviceName: parsed.deviceName || null,
      collections,
    },
    counts,
    totalRecords,
    createdAt: parsed.createdAt || null,
    version: parsed.version,
  };
}

/** Lightweight check used while typing/pasting */
export function checkBackup(text) {
  return readBackup(text);
}

export function createBackupHistoryEntry(partial = {}) {
  return {
    id: `bh_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    label: '',
    recordCount: 0,
    byteSize: 0,
    checksum: '',
    source: 'manual', // manual | scheduled | pre_restore
    deviceName: '',
    ...partial,
  };
}

export function createBackupJob(partial = {}) {
  return {
    id: `bj_${Date.now().toString(36)}`,
    status: BackupJobStatus.IDLE,
    progress: 0,
    error: null,
    startedAt: null,
    finishedAt: null,
    resultBytes: 0,
    ...partial,
  };
}

export function summarizeCounts(counts = []) {
  const nonEmpty = counts.filter((c) => c.count > 0);
  return {
    collections: counts.length,
    nonEmpty: nonEmpty.length,
    totalRecords: counts.reduce((s, c) => s + (c.count || 0), 0),
    top: nonEmpty.slice().sort((a, b) => b.count - a.count).slice(0, 8),
  };
}

export function formatBytes(n) {
  if (n == null || n < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

export function formatBackupDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}
