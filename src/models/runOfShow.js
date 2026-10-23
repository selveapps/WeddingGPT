import { createEntity } from './base';
import { MINUTES_PER_DAY, formatTime } from '../lib/time';

/**
 * The run of show (graduated from the Labs day-of timeline): what happens
 * when on the day, minute by minute. Items sync as `runOfShow`.
 *
 * An item is `{ title, start, durationMin, location, owner, eventId }` with
 * `start` in minutes after midnight, which keeps sorting, overlap checks and
 * "push everything back 15 minutes" plain arithmetic. `eventId` gives each
 * event (the mehndi, the reception) its own run of show; null is the wedding
 * day itself.
 */

export const RUN_OF_SHOW_LIMITS = {
  titleChars: 120,
  textChars: 120,
  /** Items per day. A run of show longer than this is a spreadsheet. */
  perDay: 80,
  maxDurationMin: 12 * 60,
};

const at = (h, m = 0) => h * 60 + m;

/** A typical afternoon ceremony with an evening reception, to edit from. */
export const SAMPLE_DAY = [
  { title: 'Hair and makeup', start: at(9), durationMin: 180, owner: 'Wedding party' },
  { title: 'Getting dressed', start: at(12, 30), durationMin: 45, owner: 'Couple' },
  { title: 'Couple and family photos', start: at(13, 30), durationMin: 90, owner: 'Photographer' },
  { title: 'Guests arrive', start: at(15, 30), durationMin: 30, owner: 'Ushers' },
  { title: 'Ceremony', start: at(16), durationMin: 30, owner: 'Officiant' },
  { title: 'Cocktail hour', start: at(16, 30), durationMin: 60, owner: 'Caterer' },
  { title: 'Dinner', start: at(18), durationMin: 90, owner: 'Caterer' },
  { title: 'Speeches', start: at(19, 30), durationMin: 30, owner: 'MC' },
  { title: 'First dance', start: at(20), durationMin: 10, owner: 'DJ' },
  { title: 'Dancing', start: at(20, 10), durationMin: 140, owner: 'DJ' },
  { title: 'Send-off', start: at(22, 30), durationMin: 15, owner: 'Wedding party' },
];

const clampStart = (minutes) => Math.min(MINUTES_PER_DAY - 1, Math.max(0, Math.round(minutes)));
const clampDuration = (minutes) =>
  Math.min(RUN_OF_SHOW_LIMITS.maxDurationMin, Math.max(0, Math.round(Number(minutes) || 0)));

export function createRunOfShowItem({
  weddingId,
  eventId = null,
  title = '',
  start = 0,
  durationMin = 30,
  location = '',
  owner = '',
} = {}) {
  return createEntity('ros', {
    weddingId,
    eventId,
    title: title.trim(),
    start: clampStart(start),
    durationMin: clampDuration(durationMin),
    location: location.trim(),
    owner: owner.trim(),
  });
}

/** Returns `{ field: message }`. `start` is minutes or null (unreadable). */
export function validateRunOfShowItem(fields) {
  const errors = {};
  if (!fields.title?.trim()) errors.title = 'What happens?';
  else if (fields.title.length > RUN_OF_SHOW_LIMITS.titleChars) errors.title = 'Keep it short.';
  if (fields.start === null || fields.start === undefined) errors.start = 'Try 4:30 PM or 16:30.';
  const duration = Number(fields.durationMin);
  if (!Number.isFinite(duration) || duration < 0) errors.durationMin = 'How many minutes?';
  else if (duration > RUN_OF_SHOW_LIMITS.maxDurationMin) errors.durationMin = 'Twelve hours at most.';
  for (const key of ['location', 'owner']) {
    if ((fields[key] ?? '').length > RUN_OF_SHOW_LIMITS.textChars) errors[key] = 'Keep it short.';
  }
  return errors;
}

/** The items of one day: an event's, or the wedding day's (`eventId` null). */
export const itemsForDay = (items = [], eventId = null) =>
  items.filter((item) => (item.eventId ?? null) === (eventId ?? null));

export const itemEnd = (item) => item.start + (item.durationMin ?? 0);

export function sortRunOfShow(items = []) {
  return [...items].sort((a, b) => a.start - b.start || itemEnd(a) - itemEnd(b));
}

/** Every pair where one item starts before an earlier one has finished. */
export function findOverlaps(items = []) {
  const sorted = sortRunOfShow(items);
  const overlaps = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length && sorted[j].start < itemEnd(sorted[i]); j++) {
      overlaps.push({ first: sorted[i], second: sorted[j] });
    }
  }
  return overlaps;
}

/**
 * Move one item and everything starting at or after it by `minutes` - the
 * "dinner is running 20 minutes late" button. Pass only one day's items.
 * Returns only the changed items as `{ id, start }`, clamped to the day.
 */
export function shiftFrom(items = [], itemId, minutes) {
  const anchor = items.find((item) => item.id === itemId);
  if (!anchor || !minutes) return [];
  return items
    .filter((item) => item.start >= anchor.start)
    .map((item) => ({ id: item.id, start: clampStart(item.start + minutes), was: item.start }))
    .filter((change) => change.start !== change.was)
    .map(({ id, start }) => ({ id, start }));
}

/** The run of show as text for the wedding party and vendors. */
export function runOfShowText(items = [], { title = 'Wedding day' } = {}) {
  const lines = [`${title} - run of show`, ''];
  for (const item of sortRunOfShow(items)) {
    const details = [item.location, item.owner].filter(Boolean).join(', ');
    lines.push(
      `${formatTime(item.start)} - ${formatTime(itemEnd(item))}  ${item.title}${details ? ` (${details})` : ''}`
    );
  }
  return lines.join('\n');
}
