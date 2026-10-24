import { formatBytes, formatBackupDate, summarizeCounts, BackupJobStatusMeta } from '../../../models/backup';

export function jobLabel(status) {
  return BackupJobStatusMeta[status]?.label || status || '—';
}

export function jobTone(status) {
  return BackupJobStatusMeta[status]?.tone || 'neutral';
}

export function historySummary(history = []) {
  const totalBytes = history.reduce((s, h) => s + (h.byteSize || 0), 0);
  return {
    count: history.length,
    totalBytes,
    totalBytesLabel: formatBytes(totalBytes),
    lastAt: history[0]?.createdAt || null,
    lastAtLabel: formatBackupDate(history[0]?.createdAt),
  };
}

export function previewFromCheck(checked) {
  if (!checked?.ok) return null;
  const summary = summarizeCounts(checked.counts || []);
  return {
    createdAt: checked.createdAt,
    createdAtLabel: formatBackupDate(checked.createdAt),
    version: checked.version,
    label: checked.data?.label,
    deviceName: checked.data?.deviceName,
    totalRecords: checked.totalRecords ?? summary.totalRecords,
    collections: summary.nonEmpty,
    top: summary.top,
  };
}

export function canAutoBackup(lastAt, intervalDays) {
  if (!lastAt) return true;
  const last = new Date(lastAt).getTime();
  if (Number.isNaN(last)) return true;
  const ms = (intervalDays || 7) * 86400000;
  return Date.now() - last >= ms;
}

export { formatBytes, formatBackupDate, summarizeCounts };
