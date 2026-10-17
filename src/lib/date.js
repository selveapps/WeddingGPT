/**
 * Date helpers.
 *
 * Wedding dates are stored as ISO date strings (`YYYY-MM-DD`) rather than full
 * timestamps: a wedding happens on a calendar day, and storing an instant makes
 * the countdown drift across timezones. Everything here works in the device's
 * local calendar, which is what a couple planning a wedding actually means.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

const WEEKDAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

/** Today as a `YYYY-MM-DD` string in local time. */
export function todayISO() {
  return toISODate(new Date());
}

/** Format a Date as a local `YYYY-MM-DD` string (never UTC-shifted). */
export function toISODate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse a `YYYY-MM-DD` string into a local Date at midnight. Returns null if invalid. */
export function fromISODate(iso) {
  if (typeof iso !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  // Guard against rollovers like 2026-02-31 silently becoming March 3rd.
  if (
    date.getFullYear() !== Number(y) ||
    date.getMonth() !== Number(m) - 1 ||
    date.getDate() !== Number(d)
  ) {
    return null;
  }
  return date;
}

export function isValidISODate(iso) {
  return fromISODate(iso) !== null;
}

/** Midnight-normalised copy, so day maths is never skewed by the current time. */
function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Whole days from today until `iso`.
 * Positive = future, 0 = today, negative = past.
 */
export function daysUntil(iso, from = new Date()) {
  const target = fromISODate(iso);
  if (!target) return null;
  return Math.round((startOfDay(target) - startOfDay(from)) / MS_PER_DAY);
}

export function addDays(iso, days) {
  const date = fromISODate(iso);
  if (!date) return null;
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function addMonths(iso, months) {
  const date = fromISODate(iso);
  if (!date) return null;
  const targetDay = date.getDate();
  date.setMonth(date.getMonth() + months);
  // Clamp e.g. Jan 31 + 1 month to Feb 28 rather than letting it roll to March.
  if (date.getDate() < targetDay) date.setDate(0);
  return toISODate(date);
}

// Dates are written the US way (month first), matching the launch audience.

/** `September 12, 2027` */
export function formatLongDate(iso) {
  const date = fromISODate(iso);
  if (!date) return '';
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** `Sep 12, 2027` */
export function formatMediumDate(iso) {
  const date = fromISODate(iso);
  if (!date) return '';
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** `Sat, Sep 12` - for dense list rows where the year is implied. */
export function formatShortDate(iso) {
  const date = fromISODate(iso);
  if (!date) return '';
  return `${WEEKDAYS[date.getDay()].slice(0, 3)}, ${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
}

/** `September 2027` - for approximate timing, where only month precision is known. */
export function formatMonthYear(iso) {
  const date = fromISODate(iso);
  if (!date) return '';
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Warm, human phrasing for a due date: "Today", "Tomorrow", "In 5 days",
 * "3 days overdue". Used across task rows and the deadline list.
 */
export function formatRelativeDay(iso, from = new Date()) {
  const diff = daysUntil(iso, from);
  if (diff === null) return '';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  if (diff >= 7 && diff < 14) return 'Next week';
  if (diff >= 14 && diff < 60) return `In ${Math.round(diff / 7)} weeks`;
  if (diff >= 60) return `In ${Math.round(diff / 30)} months`;
  return `${Math.abs(diff)} days overdue`;
}

/**
 * Break a day count into the units the countdown screen shows.
 * Weeks/months are approximate by design - nobody counts a wedding in exact months.
 */
export function breakDownDays(totalDays) {
  const days = Math.max(0, totalDays ?? 0);
  return {
    days,
    weeks: Math.floor(days / 7),
    months: Math.floor(days / 30.44),
    years: Math.floor(days / 365.25),
  };
}

export const MONTH_NAMES = MONTHS;
export const MONTH_NAMES_SHORT = MONTHS_SHORT;
export const WEEKDAY_NAMES = WEEKDAYS;
