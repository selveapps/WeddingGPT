import { createEntity } from './base';
import { RsvpStatus } from './enums';
import { fromClock, formatTimeRange, parseTime, toClock } from '../lib/time';
import { fromISODate } from '../lib/date';

/**
 * Wedding events (workstream C, slice C1): the mehndi on Friday, the ceremony
 * and reception on Saturday, the brunch on Sunday.
 *
 * Each event has its own date, times, place, dress code and guest list. The
 * guest list lives on the event (`invitedGuestIds`), so inviting 200 people to
 * the reception is one record change and never conflicts with editing a guest.
 * The wedding's own date stays the main date; events add detail to it.
 *
 * Times are stored as "16:30" clocks.
 */

export const EventKind = {
  CEREMONY: 'ceremony',
  RECEPTION: 'reception',
  MEHNDI: 'mehndi',
  SANGEET: 'sangeet',
  HALDI: 'haldi',
  REHEARSAL_DINNER: 'rehearsal_dinner',
  WELCOME_PARTY: 'welcome_party',
  BRUNCH: 'brunch',
  OTHER: 'other',
};

export const EVENT_KIND_META = {
  [EventKind.CEREMONY]: { label: 'Ceremony', icon: 'rings' },
  [EventKind.RECEPTION]: { label: 'Reception', icon: 'sparkle' },
  [EventKind.MEHNDI]: { label: 'Mehndi', icon: 'heart' },
  [EventKind.SANGEET]: { label: 'Sangeet', icon: 'sparkle' },
  [EventKind.HALDI]: { label: 'Haldi', icon: 'heart' },
  [EventKind.REHEARSAL_DINNER]: { label: 'Rehearsal dinner', icon: 'vendors' },
  [EventKind.WELCOME_PARTY]: { label: 'Welcome party', icon: 'guests' },
  [EventKind.BRUNCH]: { label: 'Farewell brunch', icon: 'vendors' },
  [EventKind.OTHER]: { label: 'Other', icon: 'calendar' },
};

export const GuestScope = {
  EVERYONE: 'everyone',
  INVITED: 'invited',
};

export const EVENT_LIMITS = {
  nameChars: 80,
  textChars: 1000,
  perWedding: 20,
};

export function createWeddingEvent({
  weddingId,
  name = '',
  kind = EventKind.OTHER,
  date = null,
  startTime = null,
  endTime = null,
  venueName = '',
  address = '',
  dressCode = '',
  notes = '',
  guestScope = GuestScope.EVERYONE,
  invitedGuestIds = [],
  /** `{ [guestId]: 'attending' | 'declined' }` from guests' per-event replies (slice F1). */
  attendance = {},
  order = 0,
} = {}) {
  return createEntity('event', {
    weddingId,
    name: name.trim() || EVENT_KIND_META[kind]?.label || 'Event',
    kind,
    date,
    startTime,
    endTime,
    venueName,
    address,
    dressCode,
    notes,
    guestScope,
    invitedGuestIds,
    attendance,
    order,
  });
}

/** The name an event shows: its own, or its kind's. */
export const eventName = (event) => event?.name?.trim() || EVENT_KIND_META[event?.kind]?.label || 'Event';

/** By date (undated last), then start time, then the couple's order. */
export function sortEvents(events = []) {
  return [...events].sort((a, b) => {
    if (a.date !== b.date) {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    }
    const startA = fromClock(a.startTime) ?? Infinity;
    const startB = fromClock(b.startTime) ?? Infinity;
    return startA - startB || (a.order ?? 0) - (b.order ?? 0);
  });
}

/** The guests invited to an event. */
export function eventGuests(event, guests = []) {
  if (event?.guestScope !== GuestScope.INVITED) return guests;
  const invited = new Set(event.invitedGuestIds ?? []);
  return guests.filter((guest) => invited.has(guest.id));
}

export const EventAttendance = { ATTENDING: 'attending', DECLINED: 'declined' };

/**
 * A guest's answer for one event: their per-event reply when they gave one
 * (F1), otherwise their reply for the wedding as a whole.
 */
export function guestEventStatus(event, guest) {
  const own = event?.attendance?.[guest.id];
  if (own === EventAttendance.ATTENDING) return RsvpStatus.ATTENDING;
  if (own === EventAttendance.DECLINED) return RsvpStatus.DECLINED;
  return guest.rsvpStatus;
}

/** Invited, and their replies so far - for this event where they answered for it. */
export function eventGuestSummary(event, guests = []) {
  const invited = eventGuests(event, guests);
  const statuses = invited.map((guest) => guestEventStatus(event, guest));
  return {
    invited: invited.length,
    attending: statuses.filter((status) => status === RsvpStatus.ATTENDING).length,
    declined: statuses.filter((status) => status === RsvpStatus.DECLINED).length,
    awaiting: statuses.filter((status) => status !== RsvpStatus.ATTENDING && status !== RsvpStatus.DECLINED).length,
  };
}

/** Turn the time a couple typed ("4pm", "16:30") into a stored clock, or null. */
export function clockFromInput(text) {
  if (!String(text ?? '').trim()) return null;
  return toClock(parseTime(text));
}

/** Returns `{ field: message }`. */
export function validateEvent(fields) {
  const errors = {};
  if ((fields.name ?? '').length > EVENT_LIMITS.nameChars) errors.name = 'That name is too long.';
  if (fields.date && !fromISODate(fields.date)) errors.date = 'Pick a valid date.';
  if (fields.startTimeText && clockFromInput(fields.startTimeText) === null)
    errors.startTime = 'Try a time like 4pm or 16:30.';
  if (fields.endTimeText && clockFromInput(fields.endTimeText) === null)
    errors.endTime = 'Try a time like 10pm or 22:00.';
  const start = fromClock(clockFromInput(fields.startTimeText));
  const end = fromClock(clockFromInput(fields.endTimeText));
  // An end before the start is fine past midnight; equal times are a typo.
  if (start !== null && end !== null && start === end) errors.endTime = 'The end time matches the start.';
  for (const key of ['venueName', 'address', 'dressCode', 'notes']) {
    if ((fields[key] ?? '').length > EVENT_LIMITS.textChars) errors[key] = 'That is too long.';
  }
  return errors;
}

/** "Sat, Sep 12 · 4:00 PM - 10:00 PM · The Rose Garden" pieces. */
export function eventWhen(event) {
  return formatTimeRange(event?.startTime, event?.endTime);
}

const FROM_EVENT = 'item_from_';

/**
 * Events as wedding website schedule items, for "Use my events". Ids are kept
 * per event so using it again updates rather than duplicates.
 */
export function eventsToWebsiteSchedule(events = []) {
  return sortEvents(events).map((event) => ({
    id: `${FROM_EVENT}${event.id}`,
    name: eventName(event),
    date: event.date ?? null,
    time: formatTimeRange(event.startTime, event.endTime),
    place: event.venueName ?? '',
    address: event.address ?? '',
    notes: [event.dressCode ? `Dress code: ${event.dressCode}` : '', event.notes ?? '']
      .filter(Boolean)
      .join('\n\n'),
  }));
}

/**
 * The website schedule after "Use my events": items made from an event are
 * refreshed in place (or dropped if the event is gone), items the couple
 * wrote by hand stay, and new events are added at the end.
 */
export function mergeWebsiteSchedule(existing = [], events = [], limit = Infinity) {
  const fromEvents = new Map(eventsToWebsiteSchedule(events).map((item) => [item.id, item]));
  const kept = existing
    .filter((item) => !String(item.id).startsWith(FROM_EVENT) || fromEvents.has(item.id))
    .map((item) => fromEvents.get(item.id) ?? item);
  const present = new Set(kept.map((item) => item.id));
  const added = [...fromEvents.values()].filter((item) => !present.has(item.id));
  return [...kept, ...added].slice(0, limit);
}
