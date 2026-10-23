/**
 * Times of day as minutes after midnight - sorting, durations and "push
 * everything back 15 minutes" stay plain arithmetic. Used by events and the
 * day-of timeline.
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

/** Minutes after midnight -> "16:30", the form events store. */
export function toClock(minutes) {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return null;
  const total = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** "16:30" -> 990, or null. */
export function fromClock(clock) {
  const match = /^(\d{2}):(\d{2})$/.exec(clock ?? '');
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

/** "4:30 PM - 7:00 PM", "4:30 PM", or "" from stored clocks. */
export function formatTimeRange(start, end) {
  const from = fromClock(start);
  const to = fromClock(end);
  if (from === null) return '';
  return to === null ? formatTime(from) : `${formatTime(from)} - ${formatTime(to)}`;
}
