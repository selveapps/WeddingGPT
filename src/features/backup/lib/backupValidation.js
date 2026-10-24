import { BACKUP_LIMITS, BACKUP_FORMAT } from '../../../models/backup';

export function validatePasteInput(text) {
  const errors = [];
  if (typeof text !== 'string' || !text.trim()) {
    errors.push('Paste a backup file or choose one from disk.');
  } else if (text.length > BACKUP_LIMITS.textChars) {
    errors.push('This text is larger than the allowed backup size.');
  }
  return { ok: errors.length === 0, errors };
}

export function looksLikeBackup(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim();
  return t.startsWith('{') && t.includes(BACKUP_FORMAT);
}

export function confirmPhrase() {
  return 'REPLACE';
}

export function validateConfirmPhrase(input) {
  return String(input || '').trim().toUpperCase() === confirmPhrase();
}
