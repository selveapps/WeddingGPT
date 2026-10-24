/**
 * Honeymoon Planner Pro – itinerary, bookings, budget, packing links.
 */
import { createEntity } from './base';

export const TripSegmentType = {
  FLIGHT: 'flight', HOTEL: 'hotel', ACTIVITY: 'activity', TRANSFER: 'transfer',
  MEAL: 'meal', FREE: 'free', OTHER: 'other',
};

export function createHoneymoonTrip(partial = {}) {
  return createEntity({
    weddingId: null, title: 'Honeymoon', destination: '', startDate: null, endDate: null,
    budgetTotal: 0, currency: 'USD', notes: '', status: 'planning', ...partial,
  });
}

export function createTripSegment(partial = {}) {
  return createEntity({
    weddingId: null, tripId: null, type: TripSegmentType.ACTIVITY, title: '',
    startAt: null, endAt: null, location: '', cost: 0, currency: 'USD',
    confirmationCode: '', url: null, notes: '', sortOrder: 0, ...partial,
  });
}

export function createTripBooking(partial = {}) {
  return createEntity({
    weddingId: null, tripId: null, segmentId: null, provider: '',
    confirmationCode: '', amount: 0, currency: 'USD', paid: false,
    cancellationPolicy: '', documents: [], ...partial,
  });
}

export function createDayPlan(partial = {}) {
  return createEntity({
    weddingId: null, tripId: null, date: null, title: '',
    segmentIds: [], notes: '', ...partial,
  });
}

export function deriveHoneymoonStats(trips, segments, bookings) {
  const t = Array.isArray(trips) ? trips : Object.values(trips?.byId || {});
  const s = Array.isArray(segments) ? segments : Object.values(segments?.byId || {});
  const b = Array.isArray(bookings) ? bookings : Object.values(bookings?.byId || {});
  return {
    tripCount: t.length,
    segmentCount: s.length,
    bookingCount: b.length,
    totalCost: s.reduce((sum, x) => sum + (x.cost || 0), 0) + b.reduce((sum, x) => sum + (x.amount || 0), 0),
    paidAmount: b.filter((x) => x.paid).reduce((sum, x) => sum + (x.amount || 0), 0),
  };
}
