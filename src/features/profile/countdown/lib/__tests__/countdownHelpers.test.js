import { getCountdownBreakdown, getWeddingCountdown, getWeddingDateLabel } from '../countdownHelpers';

describe('wedding countdown', () => {
  const today = new Date(2026, 9, 23, 12);

  it('handles invalid, past, present and future dates', () => {
    expect(getWeddingCountdown(null, today).valid).toBe(false);
    expect(getWeddingCountdown('2026-10-23', today).label).toBe('Your wedding is today!');
    expect(getWeddingCountdown('2026-10-24', today).label).toBe('1 day to go');
    expect(getWeddingCountdown('2026-10-22', today).label).toBe('1 day since your wedding');
  });

  it('returns a breakdown only for valid upcoming dates', () => {
    expect(getCountdownBreakdown('2026-10-30', today)).toMatchObject({
      days: 0,
      weeks: 1,
      totalDays: 7,
    });
    expect(getCountdownBreakdown('not-a-date', today)).toBeNull();
    expect(getCountdownBreakdown('2026-10-22', today)).toBeNull();
  });

  it('formats date labels without showing an invalid date', () => {
    expect(getWeddingDateLabel('2026-10-23')).toBe('October 23, 2026');
    expect(getWeddingDateLabel('invalid')).toBe('Date not set');
  });
});
