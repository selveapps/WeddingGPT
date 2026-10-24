/**
 * Rehearsal Dinner Planner.
 */
import { createEntity } from './base';

export function createRehearsalEvent(partial = {}) {
  return createEntity({
    weddingId: null, title: 'Rehearsal Dinner', date: null, startTime: '',
    endTime: '', venueName: '', address: '', guestCountEstimate: 0,
    budget: 0, currency: 'USD', notes: '', hostGuestIds: [], ...partial,
  });
}

export function createRehearsalGuest(partial = {}) {
  return createEntity({
    weddingId: null, eventId: null, guestId: null, name: '',
    rsvpStatus: 'pending', mealChoice: '', notes: '', ...partial,
  });
}

export function createRehearsalAgendaItem(partial = {}) {
  return createEntity({
    weddingId: null, eventId: null, title: '', startTime: '',
    durationMin: 15, speaker: '', notes: '', sortOrder: 0, ...partial,
  });
}

export function deriveRehearsalStats(events, guests, agenda) {
  const e = Array.isArray(events) ? events : Object.values(events?.byId || {});
  const g = Array.isArray(guests) ? guests : Object.values(guests?.byId || {});
  const a = Array.isArray(agenda) ? agenda : Object.values(agenda?.byId || {});
  return {
    eventCount: e.length,
    guestCount: g.length,
    yesCount: g.filter((x) => x.rsvpStatus === 'yes').length,
    agendaCount: a.length,
  };
}
