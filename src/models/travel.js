/**
 * Travel & Accommodation Planner for couple + guests.
 *
 * Room blocks, flight tracking (manual), transport logistics, welcome bags,
 * and local recommendations.
 */

import { createEntity } from './base';

export const StayType = {
  HOTEL: 'hotel',
  AIRBNB: 'airbnb',
  VRBO: 'vrbo',
  FAMILY: 'family',
  OTHER: 'other',
};

export const StayTypeMeta = {
  [StayType.HOTEL]: { label: 'Hotel', emoji: '🏨' },
  [StayType.AIRBNB]: { label: 'Airbnb', emoji: '🏠' },
  [StayType.VRBO]: { label: 'VRBO / Vacation rental', emoji: '🏡' },
  [StayType.FAMILY]: { label: 'Family / Friends', emoji: '👨‍👩‍👧' },
  [StayType.OTHER]: { label: 'Other', emoji: '📍' },
};

export const TransportMode = {
  FLIGHT: 'flight',
  TRAIN: 'train',
  CAR: 'car',
  BUS: 'bus',
  SHUTTLE: 'shuttle',
  RIDESHARE: 'rideshare',
  OTHER: 'other',
};

export function createStay(partial = {}) {
  return createEntity({
    weddingId: null,
    type: StayType.HOTEL,
    name: '',
    address: '',
    city: '',
    region: '',
    country: '',
    checkIn: null,
    checkOut: null,
    roomBlockCode: '',
    roomBlockDeadline: null,
    roomCount: 0,
    rateFrom: 0,
    currency: 'USD',
    bookingUrl: null,
    phone: '',
    notes: '',
    isPrimaryBlock: false,
    distanceToVenueKm: null,
    ...partial,
  });
}

export function createGuestStayAssignment(partial = {}) {
  return createEntity({
    weddingId: null,
    stayId: null,
    guestId: null,
    householdId: null,
    rooms: 1,
    confirmationCode: '',
    notes: '',
    ...partial,
  });
}

export function createTransport(partial = {}) {
  return createEntity({
    weddingId: null,
    mode: TransportMode.SHUTTLE,
    title: '',
    fromLocation: '',
    toLocation: '',
    departureAt: null,
    arrivalAt: null,
    capacity: 0,
    cost: 0,
    currency: 'USD',
    vendorId: null,
    notes: '',
    isGuestFacing: true,
    ...partial,
  });
}

export function createFlight(partial = {}) {
  return createEntity({
    weddingId: null,
    guestId: null, // null = couple
    airline: '',
    flightNumber: '',
    departureAirport: '',
    arrivalAirport: '',
    departureAt: null,
    arrivalAt: null,
    confirmationCode: '',
    notes: '',
    ...partial,
  });
}

export function createLocalRecommendation(partial = {}) {
  return createEntity({
    weddingId: null,
    category: 'restaurant', // restaurant | activity | shop | other
    name: '',
    description: '',
    address: '',
    url: null,
    priceLevel: 2, // 1-4
    tags: [],
    isHighlight: false,
    ...partial,
  });
}

export function createWelcomeBagItem(partial = {}) {
  return createEntity({
    weddingId: null,
    name: '',
    quantityPerBag: 1,
    notes: '',
    costPerUnit: 0,
    ...partial,
  });
}

export function staysForWedding(staysCollection) {
  const list = Array.isArray(staysCollection)
    ? staysCollection
    : Object.values(staysCollection?.byId || {});
  return list.sort((a, b) => {
    if (a.isPrimaryBlock !== b.isPrimaryBlock) return a.isPrimaryBlock ? -1 : 1;
    return (a.name || '').localeCompare(b.name || '');
  });
}

export function deriveTravelStats(stays, transports, flights) {
  const s = Array.isArray(stays) ? stays : Object.values(stays?.byId || {});
  const t = Array.isArray(transports) ? transports : Object.values(transports?.byId || {});
  const f = Array.isArray(flights) ? flights : Object.values(flights?.byId || {});
  return {
    stayCount: s.length,
    primaryBlock: s.find((x) => x.isPrimaryBlock) || null,
    transportCount: t.length,
    flightCount: f.length,
    totalRoomEstimate: s.reduce((sum, x) => sum + (x.roomCount || 0), 0),
  };
}
