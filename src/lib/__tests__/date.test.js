import {
  addDays,
  addMonths,
  breakDownDays,
  daysUntil,
  formatLongDate,
  formatMediumDate,
  formatMonthYear,
  formatRelativeDay,
  formatShortDate,
  fromISODate,
  isValidISODate,
  toISODate,
} from '../date';

const FROM = new Date(2027, 0, 4, 18, 30); // Monday 4 Jan 2027, evening

describe('toISODate / fromISODate', () => {
  it('round-trips a local calendar day', () => {
    expect(toISODate(new Date(2027, 8, 12, 23, 59))).toBe('2027-09-12');
    expect(toISODate(fromISODate('2027-09-12'))).toBe('2027-09-12');
  });

  it('rejects invalid input', () => {
    expect(toISODate(new Date('nope'))).toBeNull();
    expect(toISODate('2027-09-12')).toBeNull();
    expect(fromISODate('2027-9-12')).toBeNull();
    expect(fromISODate(20270912)).toBeNull();
  });

  it('does not let impossible days roll over', () => {
    expect(fromISODate('2027-02-29')).toBeNull();
    expect(fromISODate('2028-02-29')).not.toBeNull();
    expect(isValidISODate('2027-04-31')).toBe(false);
  });

  it('trims surrounding whitespace', () => {
    expect(isValidISODate(' 2027-09-12 ')).toBe(true);
  });
});

describe('daysUntil', () => {
  it('counts whole calendar days regardless of the time of day', () => {
    expect(daysUntil('2027-01-04', FROM)).toBe(0);
    expect(daysUntil('2027-01-05', FROM)).toBe(1);
    expect(daysUntil('2027-01-01', FROM)).toBe(-3);
  });

  it('returns null for an invalid date', () => {
    expect(daysUntil('soon', FROM)).toBeNull();
  });
});

describe('addDays / addMonths', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays('2027-01-30', 3)).toBe('2027-02-02');
    expect(addDays('2027-12-31', 1)).toBe('2028-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('clamps to the end of a shorter month', () => {
    expect(addMonths('2027-01-31', 1)).toBe('2027-02-28');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonths('2027-03-31', -1)).toBe('2027-02-28');
  });

  it('moves across years', () => {
    expect(addMonths('2027-09-12', -12)).toBe('2026-09-12');
    expect(addMonths('2027-11-15', 3)).toBe('2028-02-15');
  });

  it('returns null for an invalid date', () => {
    expect(addDays('', 1)).toBeNull();
    expect(addMonths('bad', 1)).toBeNull();
  });
});

describe('formatting', () => {
  it('formats long, medium, short and month-year dates', () => {
    expect(formatLongDate('2027-09-12')).toBe('September 12, 2027');
    expect(formatMediumDate('2027-09-12')).toBe('Sep 12, 2027');
    expect(formatShortDate('2027-09-11')).toBe('Sat, Sep 11');
    expect(formatMonthYear('2027-09-12')).toBe('September 2027');
  });

  it('returns an empty string for invalid dates', () => {
    expect(formatLongDate(null)).toBe('');
    expect(formatMediumDate('x')).toBe('');
    expect(formatShortDate(undefined)).toBe('');
    expect(formatMonthYear('2027-13-01')).toBe('');
  });
});

describe('formatRelativeDay', () => {
  const rel = (iso) => formatRelativeDay(iso, FROM);

  it('names nearby days', () => {
    expect(rel('2027-01-04')).toBe('Today');
    expect(rel('2027-01-05')).toBe('Tomorrow');
    expect(rel('2027-01-03')).toBe('Yesterday');
  });

  it('counts days, weeks and months ahead', () => {
    expect(rel('2027-01-09')).toBe('In 5 days');
    expect(rel('2027-01-11')).toBe('Next week');
    expect(rel('2027-01-25')).toBe('In 3 weeks');
    expect(rel('2027-04-04')).toBe('In 3 months');
  });

  it('reports overdue days', () => {
    expect(rel('2027-01-01')).toBe('3 days overdue');
  });

  it('is empty for an invalid date', () => {
    expect(rel(null)).toBe('');
  });
});

describe('breakDownDays', () => {
  it('splits a day count into approximate units', () => {
    expect(breakDownDays(400)).toEqual({ days: 400, weeks: 57, months: 13, years: 1 });
  });

  it('treats negative and missing counts as zero', () => {
    expect(breakDownDays(-5)).toEqual({ days: 0, weeks: 0, months: 0, years: 0 });
    expect(breakDownDays(null).days).toBe(0);
  });
});
