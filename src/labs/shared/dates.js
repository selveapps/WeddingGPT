import { addDays, addMonths, toISODate, fromISODate } from '@/lib/date';

/**
 * Loose date finding for text people type or paste: "by March 3",
 * "2027-03-01", "3/14/2027", "tomorrow", "in 2 weeks". US order (month
 * first) for numeric dates, matching the launch audience. A date with no year
 * means its next occurrence on or after `from`.
 */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_RE = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';

function build(year, monthIndex, day) {
  const iso = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return fromISODate(iso) ? iso : null;
}

function nextOccurrence(monthIndex, day, from) {
  const today = toISODate(from);
  const thisYear = build(from.getFullYear(), monthIndex, day);
  if (thisYear && thisYear >= today) return thisYear;
  return build(from.getFullYear() + 1, monthIndex, day);
}

const PATTERNS = [
  {
    re: /\b(\d{4})-(\d{2})-(\d{2})\b/,
    toISO: (m) => build(Number(m[1]), Number(m[2]) - 1, Number(m[3])),
  },
  {
    re: new RegExp(`\\b${MONTH_RE}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b`, 'i'),
    toISO: (m, from) => {
      const month = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
      return m[3] ? build(Number(m[3]), month, Number(m[2])) : nextOccurrence(month, Number(m[2]), from);
    },
  },
  {
    re: new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_RE}(?:,?\\s+(\\d{4}))?\\b`, 'i'),
    toISO: (m, from) => {
      const month = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase());
      return m[3] ? build(Number(m[3]), month, Number(m[1])) : nextOccurrence(month, Number(m[1]), from);
    },
  },
  {
    re: /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/,
    toISO: (m, from) => {
      const month = Number(m[1]) - 1;
      const day = Number(m[2]);
      if (!m[3]) return nextOccurrence(month, day, from);
      const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
      return build(year, month, day);
    },
  },
  { re: /\btoday\b/i, toISO: (m, from) => toISODate(from) },
  { re: /\btomorrow\b/i, toISO: (m, from) => addDays(toISODate(from), 1) },
  { re: /\bnext week\b/i, toISO: (m, from) => addDays(toISODate(from), 7) },
  { re: /\bnext month\b/i, toISO: (m, from) => addMonths(toISODate(from), 1) },
  {
    re: /\bin\s+(\d{1,3})\s+(day|week|month)s?\b/i,
    toISO: (m, from) => {
      const n = Number(m[1]);
      const unit = m[2].toLowerCase();
      if (unit === 'month') return addMonths(toISODate(from), n);
      return addDays(toISODate(from), unit === 'week' ? n * 7 : n);
    },
  },
];

/** Every date in the text, in reading order: `[{ iso, index, raw }]`. */
export function findDates(text, from = new Date()) {
  const found = [];
  const source = text ?? '';
  for (const { re, toISO } of PATTERNS) {
    const global = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
    for (const match of source.matchAll(global)) {
      const iso = toISO(match, from);
      if (!iso) continue;
      const overlaps = found.some(
        (entry) => match.index < entry.index + entry.raw.length && entry.index < match.index + match[0].length
      );
      if (!overlaps) found.push({ iso, index: match.index, raw: match[0] });
    }
  }
  return found.sort((a, b) => a.index - b.index);
}

export function findDate(text, from = new Date()) {
  return findDates(text, from)[0] ?? null;
}
