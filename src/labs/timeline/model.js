/**
 * Day-of timeline (Labs).
 *
 * Events are `{ id, title, start, durationMin, location, owner }` with `start`
 * in minutes after midnight, which keeps sorting, overlap checks and
 * "push everything back 15 minutes" plain arithmetic.
 */

export const MINUTES_PER_DAY = 24 * 60;

/** Accepts "16:30", "4:30pm", "4:30 PM", "4pm", "9". Returns minutes or null. */
export function parseTime(text) {
  const match = /^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?\s*$/i.exec(text ?? '');
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const meridiem = match[3]?.toLowerCase();
  if (minutes > 59) return null;
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (meridiem.startsWith('p') && hours !== 12) hours += 12;
    if (meridiem.startsWith('a') && hours === 12) hours = 0;
  } else if (hours > 23) {
    return null;
  }
  return hours * 60 + minutes;
}

/** 990 -> "4:30 PM" */
export function formatTime(minutes) {
  const total = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours24 = Math.floor(total / 60);
  const mins = String(total % 60).padStart(2, '0');
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${mins} ${hours24 < 12 ? 'AM' : 'PM'}`;
}

export function formatDuration(minutes) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ');
}

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
