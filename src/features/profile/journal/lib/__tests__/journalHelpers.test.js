import { formatJournalDate, sortJournalEntries, validateJournalEntry } from '../journalHelpers';

describe('couple journal helpers', () => {
  it('requires a title and body and enforces field limits', () => {
    expect(validateJournalEntry({}).isValid).toBe(false);
    expect(validateJournalEntry({ title: 'A note', body: 'A thought' }).isValid).toBe(true);
    expect(validateJournalEntry({ title: 'x'.repeat(81), body: 'ok' }).errors.title).toBeTruthy();
  });

  it('sorts newest entries first without mutating the source', () => {
    const entries = [{ createdAt: '2025-01-01' }, { createdAt: '2026-01-01' }];
    expect(sortJournalEntries(entries)[0].createdAt).toBe('2026-01-01');
    expect(entries[0].createdAt).toBe('2025-01-01');
  });

  it('formats saved timestamps and handles damaged values', () => {
    expect(formatJournalDate('not-a-date')).toBe('Saved note');
    expect(formatJournalDate('2025-08-02T12:00:00Z')).toContain('Aug');
  });
});
