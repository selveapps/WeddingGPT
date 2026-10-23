import { getCurrentLocalDate, getNextAnniversary } from '../anniversaryHelpers';

describe('next relationship anniversary', () => {
  it('selects the nearest upcoming anniversary from relationship milestones', () => {
    const now = new Date(2026, 9, 23, 12);
    const result = getNextAnniversary(
      [
        { title: 'First met', type: 'relationship', date: '2023-12-01' },
        { title: 'Started dating', type: 'relationship', date: '2024-11-01' },
        { title: 'Planning began', type: 'planning', date: '2026-10-30' },
      ],
      now
    );
    expect(result).toMatchObject({ title: 'Started dating', years: 2, daysUntil: 9 });
  });

  it('does not create a zero-year anniversary before the first year', () => {
    const result = getNextAnniversary(
      [{ title: 'First date', type: 'relationship', date: '2026-12-01' }],
      new Date(2026, 9, 23, 12)
    );
    expect(result).toMatchObject({ date: '2027-12-01', years: 1 });
  });

  it('clamps leap-day anniversaries and ignores invalid rows', () => {
    const result = getNextAnniversary(
      [
        { title: 'Leap day', type: 'relationship', date: '2024-02-29' },
        { title: 'Broken', type: 'relationship', date: 'not-a-date' },
      ],
      new Date(2025, 0, 1, 12)
    );
    expect(result.date).toBe('2025-02-28');
    expect(getCurrentLocalDate(new Date(2025, 0, 2))).toBe('2025-01-02');
  });
});
