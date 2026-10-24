import { validatePasteInput, looksLikeBackup, validateConfirmPhrase, confirmPhrase } from '../backupValidation';

describe('backupValidation', () => {
  it('empty paste fails', () => {
    expect(validatePasteInput('').ok).toBe(false);
  });

  it('looksLikeBackup', () => {
    expect(looksLikeBackup('{"format":"weddinggpt-backup"}')).toBe(true);
    expect(looksLikeBackup('hello')).toBe(false);
  });

  it('confirm phrase', () => {
    expect(validateConfirmPhrase(confirmPhrase())).toBe(true);
    expect(validateConfirmPhrase('nope')).toBe(false);
  });
});
