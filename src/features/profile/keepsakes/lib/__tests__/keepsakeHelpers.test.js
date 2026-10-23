import { isCalendarDate, keepsakeCategoryLabel, sortKeepsakes, validateKeepsake } from '../keepsakeHelpers';

describe('keepsake helpers', () => {
  it('validates a title, category and real calendar date', () => {
    expect(
      validateKeepsake({ title: 'Our first dance', category: 'story', date: '2026-02-28' }).isValid
    ).toBe(true);
    expect(
      validateKeepsake({ title: 'Moment', category: 'story', date: '2026-02-30' }).errors.date
    ).toBeTruthy();
    expect(isCalendarDate('2024-02-29')).toBe(true);
    expect(isCalendarDate('2025-02-29')).toBe(false);
  });

  it('keeps the source order intact while sorting newest first', () => {
    const entries = [{ createdAt: '2024' }, { createdAt: '2026' }];
    expect(sortKeepsakes(entries)[0].createdAt).toBe('2026');
    expect(entries[0].createdAt).toBe('2024');
  });

  it('uses a human label for known types and a safe fallback for unknown ones', () => {
    expect(keepsakeCategoryLabel('tradition')).toBe('Tradition');
    expect(keepsakeCategoryLabel('other')).toBe('Keepsake');
  });
});
