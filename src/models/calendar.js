import { eventName, sortEvents } from './events';
import { coupleDisplayName } from './wedding';
import { fromClock } from '../lib/time';
import { fromISODate } from '../lib/date';

/**
 * The wedding's events for a calendar: the phone's own (through
 * `services/calendar`) or a standard .ics file (RFC 5545) a browser downloads
 * and any calendar app opens.
 *
 * Times are floating local times - "4pm" means 4pm wherever the wedding is,
 * which is how couples and guests read them. An event without a start time is
 * all day. Without an end time it is given DEFAULT_EVENT_MINUTES, since
 * calendars need an end; an end before the start runs past midnight.
 *
 * Each entry keeps a stable `key` (the event's id), so adding again updates
 * what was added before instead of duplicating it.
 */

export const DEFAULT_EVENT_MINUTES = 2 * 60;

const atMinutes = (iso, minutes) => {
  const day = fromISODate(iso);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes, 0);
};

function eventNotes(event) {
  return [event.dressCode?.trim() && `Dress code: ${event.dressCode.trim()}`, event.notes?.trim()]
    .filter(Boolean)
    .join('\n\n');
}

/**
 * `[{ key, title, allDay, start, end, location, notes }]`, soonest first.
 * Undated events are left out. `wedding` only names the couple in titles.
 */
export function calendarEntries({ events = [], wedding = null } = {}) {
  const couple = wedding && (wedding.ownerName || wedding.partnerName) ? coupleDisplayName(wedding) : null;
  const suffix = couple ? ` - ${couple}'s wedding` : '';

  return sortEvents(events)
    .filter((event) => event.date && fromISODate(event.date))
    .map((event) => {
      const start = fromClock(event.startTime);
      const end = fromClock(event.endTime);
      const allDay = start === null;
      const length = allDay
        ? 24 * 60
        : end === null
          ? DEFAULT_EVENT_MINUTES
          : (end - start + 24 * 60) % (24 * 60) || DEFAULT_EVENT_MINUTES;
      const from = allDay ? 0 : start;
      return {
        key: event.id,
        title: `${eventName(event)}${suffix}`,
        allDay,
        start: atMinutes(event.date, from),
        end: atMinutes(event.date, from + length),
        location: [event.venueName?.trim(), event.address?.trim()].filter(Boolean).join(', '),
        notes: eventNotes(event),
      };
    });
}

// --- .ics ------------------------------------------------------------------

const pad = (n) => String(n).padStart(2, '0');
const icsDate = (date) => `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
const icsLocal = (date) => `${icsDate(date)}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
const icsUtc = (date) =>
  `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;

/** Text values escape backslash, semicolon, comma and newlines (RFC 5545 §3.3.11). */
export const icsText = (value) =>
  String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

/** Lines longer than 75 octets continue on the next line after a space (§3.1). */
export function foldLine(line) {
  const bytes = (text) => new TextEncoder().encode(text).length;
  if (bytes(line) <= 75) return line;
  const parts = [];
  let current = '';
  for (const char of line) {
    // The first line holds 75 octets; continuations lose one to the leading space.
    if (bytes(current + char) > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = '';
    }
    current += char;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

/** The entries as one .ics calendar. `now` stamps it. */
export function calendarIcs(entries = [], { now = new Date() } = {}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Selve Apps//WeddingGPT//EN',
    'CALSCALE:GREGORIAN',
  ];
  for (const entry of entries) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${entry.key}@weddinggpt.app`,
      `DTSTAMP:${icsUtc(now)}`,
      entry.allDay ? `DTSTART;VALUE=DATE:${icsDate(entry.start)}` : `DTSTART:${icsLocal(entry.start)}`,
      entry.allDay ? `DTEND;VALUE=DATE:${icsDate(entry.end)}` : `DTEND:${icsLocal(entry.end)}`,
      `SUMMARY:${icsText(entry.title)}`
    );
    if (entry.location) lines.push(`LOCATION:${icsText(entry.location)}`);
    if (entry.notes) lines.push(`DESCRIPTION:${icsText(entry.notes)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}
