import { historySummary, previewFromCheck, canAutoBackup } from '../backupSelectors';

describe('backupSelectors', () => {
  it('history summary', () => {
    const s = historySummary([
      { createdAt: '2026-01-02', byteSize: 100 },
      { createdAt: '2026-01-01', byteSize: 50 },
    ]);
    expect(s.count).toBe(2);
    expect(s.totalBytes).toBe(150);
  });

  it('preview null when invalid', () => {
    expect(previewFromCheck({ ok: false })).toBe(null);
  });

  it('canAutoBackup', () => {
    expect(canAutoBackup(null, 7)).toBe(true);
    expect(canAutoBackup(new Date().toISOString(), 7)).toBe(false);
  });
});
