import { MINUTES_PER_DAY, formatTime } from '@/lib/time';

/**
 * Day-of timeline (Labs).
 *
 * Events are `{ id, title, start, durationMin, location, owner }` with `start`
 * in minutes after midnight, which keeps sorting, overlap checks and
 * "push everything back 15 minutes" plain arithmetic.
 */

// The time helpers moved to src/lib/time.js so events (workstream C) share them.
export { MINUTES_PER_DAY, parseTime, formatTime, formatDuration } from '@/lib/time';

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

export const endOf = (event) => event.start + (event.durationMin ?? 0);

export function sortEvents(events = []) {
  return [...events].sort((a, b) => a.start - b.start || endOf(a) - endOf(b));
}

/** Every pair where one event starts before an earlier one has finished. */
export function findOverlaps(events = []) {
  const sorted = sortEvents(events);
  const overlaps = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length && sorted[j].start < endOf(sorted[i]); j++) {
      overlaps.push({ first: sorted[i], second: sorted[j] });
    }
  }
  return overlaps;
}

/**
 * Move one event and everything starting at or after it by `minutes` - the
 * "dinner is running 20 minutes late" button. Returns only the changed events
 * as `{ id, start }`, clamped to the day.
 */
export function shiftFrom(events = [], eventId, minutes) {
  const anchor = events.find((event) => event.id === eventId);
  if (!anchor || !minutes) return [];
  return events
    .filter((event) => event.start >= anchor.start)
    .map((event) => ({
      id: event.id,
      start: Math.min(MINUTES_PER_DAY - 1, Math.max(0, event.start + minutes)),
    }))
    .filter((change) => change.start !== events.find((event) => event.id === change.id).start);
}

/** The run-of-show as text for the wedding party and vendors. */
export function timelineText(events = [], { title = 'Wedding day' } = {}) {
  const lines = [`${title} - run of show`, ''];
  for (const event of sortEvents(events)) {
    const details = [event.location, event.owner].filter(Boolean).join(', ');
    lines.push(`${formatTime(event.start)} - ${formatTime(endOf(event))}  ${event.title}${details ? ` (${details})` : ''}`);
  }
  return lines.join('\n');
}
