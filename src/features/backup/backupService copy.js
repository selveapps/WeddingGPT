/**
 * Backup service – collect slices, build file, share/save, restore into stores.
 * Integrates with existing sync collections when available.
 */

import {
  buildBackup,
  readBackup,
  checkBackup,
  createBackupHistoryEntry,
  createBackupJob,
  BackupJobStatus,
  BACKUP_LIMITS,
  formatBytes,
} from '../../models/backup';

/** Default collection names matching WeddingGPT sync-style stores */
export const DEFAULT_COLLECTIONS = [
  'wedding', 'tasks', 'guests', 'budget', 'expenses', 'categories',
  'vendors', 'events', 'seating', 'rsvp', 'gifts', 'packing',
  'party', 'runOfShow', 'website', 'settings',
];

/**
 * Collect slices from a getter map: { collectionName: () => value }
 * value is either a "many" collection or a single record/null.
 */
export function collectSlices(getters = {}) {
  const slices = [];
  for (const [collection, getter] of Object.entries(getters)) {
    try {
      const value = typeof getter === 'function' ? getter() : getter;
      slices.push({ collection, value: value ?? null });
    } catch (err) {
      slices.push({ collection, value: null, error: String(err?.message || err) });
    }
  }
  return slices;
}

/**
 * Build a full backup string from getters.
 */
export function createBackupText(getters, options = {}) {
  const slices = collectSlices(getters);
  return buildBackup(slices, options);
}

/**
 * Validate pasted/picked text.
 */
export function validateBackupText(text) {
  return checkBackup(text);
}

/**
 * Apply a validated backup to store setters.
 * setters: { collectionName: (value) => void }
 * Returns number of records applied.
 */
export function applyBackup(checked, setters = {}) {
  if (!checked?.ok || !checked.data?.collections) {
    throw new Error(checked?.error || 'Invalid backup');
  }
  let records = 0;
  for (const [name, value] of Object.entries(checked.data.collections)) {
    const set = setters[name];
    if (typeof set === 'function') {
      set(value);
    }
    if (value && value.allIds) records += value.allIds.length;
    else if (value) records += 1;
  }
  return records;
}

/**
 * Run a backup job with progress callbacks.
 */
export async function runBackupJob({
  getters,
  label,
  deviceName,
  onProgress,
  saveFn, // async (text) => 'shared' | 'saved' | 'failed' | 'cancelled'
}) {
  const job = createBackupJob({ status: BackupJobStatus.COLLECTING, startedAt: Date.now(), progress: 0.1 });
  onProgress?.(job);

  try {
    job.status = BackupJobStatus.SERIALIZING;
    job.progress = 0.4;
    onProgress?.(job);

    const text = createBackupText(getters, { label, deviceName });
    job.resultBytes = text.length;
    job.progress = 0.7;
    job.status = BackupJobStatus.WRITING;
    onProgress?.(job);

    const result = saveFn ? await saveFn(text) : 'saved';
    if (result === 'failed' || result === 'cancelled') {
      job.status = BackupJobStatus.FAILED;
      job.error = result;
      job.finishedAt = Date.now();
      onProgress?.(job);
      return { job, text: null, history: null };
    }

    job.status = BackupJobStatus.DONE;
    job.progress = 1;
    job.finishedAt = Date.now();
    onProgress?.(job);

    const checked = readBackup(text);
    const history = createBackupHistoryEntry({
      label: label || 'Manual backup',
      recordCount: checked.ok ? checked.totalRecords : 0,
      byteSize: text.length,
      checksum: checked.ok ? checksumFromText(text) : '',
      source: 'manual',
      deviceName: deviceName || '',
    });

    return { job, text, history, result };
  } catch (err) {
    job.status = BackupJobStatus.FAILED;
    job.error = String(err?.message || err);
    job.finishedAt = Date.now();
    onProgress?.(job);
    return { job, text: null, history: null };
  }
}

function checksumFromText(text) {
  try {
    const parsed = JSON.parse(text);
    return parsed.checksum || '';
  } catch {
    return '';
  }
}

export function estimateBackupSize(getters) {
  try {
    const text = createBackupText(getters);
    return { bytes: text.length, label: formatBytes(text.length) };
  } catch {
    return { bytes: 0, label: '—' };
  }
}

export { readBackup, checkBackup, buildBackup, BACKUP_LIMITS };
