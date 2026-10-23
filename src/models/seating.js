import { createEntity } from './base';
import { RsvpStatus } from './enums';
import { guestFullName } from './guests';
import { eventGuests, guestEventStatus } from './events';

/**
 * Seating chart.
 *
 * Tables are `{ id, name, capacity, guestIds, eventId }`. `eventId` gives
 * each event its own room (slice F2); null is the wedding day itself. The
 * functions below take one room's tables at a time. Guests are only ever
 * referenced by ID, so editing a guest's name shows up on the chart
 * immediately. Everything here is pure; the seating store persists (and
 * syncs) what these functions return.
 *
 * Keep-apart pairs live in one rules record per wedding: `{ avoidPairs }`.
 */

export const DEFAULT_TABLE_CAPACITY = 8;
export const MAX_TABLE_CAPACITY = 40;

export function createSeatingTable({
  weddingId,
  name,
  capacity = DEFAULT_TABLE_CAPACITY,
  guestIds = [],
  eventId = null,
} = {}) {
  const seats = Math.min(MAX_TABLE_CAPACITY, Math.max(1, Math.round(Number(capacity) || DEFAULT_TABLE_CAPACITY)));
  return createEntity('table', { weddingId, name, capacity: seats, guestIds, eventId });
}

/** One room's tables: an event's, or the wedding day's (`eventId` null). */
export const tablesForEvent = (tables = [], eventId = null) =>
  tables.filter((table) => (table.eventId ?? null) === (eventId ?? null));

export function createSeatingRules({ weddingId, avoidPairs = [] } = {}) {
  return createEntity('seatrules', { weddingId, avoidPairs });
}

/**
 * Tables with any guest who no longer exists taken off, so a deleted guest
 * never holds a seat. Returns the same array when nothing changed.
 */
export function withKnownGuests(tables, knownIds) {
  let changed = false;
  const next = tables.map((table) => {
    const guestIds = table.guestIds.filter((id) => knownIds.has(id));
    if (guestIds.length === table.guestIds.length) return table;
    changed = true;
    return { ...table, guestIds };
  });
  return changed ? next : tables;
}

/**
 * Anyone not declined still needs a seat on the plan. For an event: anyone
 * invited to it who has not declined it (their answer for that event first).
 */
export function seatableGuests(guests = [], event = null) {
  if (!event) return guests.filter((guest) => guest.rsvpStatus !== RsvpStatus.DECLINED);
  return eventGuests(event, guests).filter((guest) => guestEventStatus(event, guest) !== RsvpStatus.DECLINED);
}

export function freeSeats(table) {
  return Math.max(0, (table.capacity ?? 0) - (table.guestIds?.length ?? 0));
}

export function unassignGuest(tables, guestId) {
  return tables.map((table) =>
    table.guestIds.includes(guestId)
      ? { ...table, guestIds: table.guestIds.filter((id) => id !== guestId) }
      : table
  );
}

/** Move a guest to a table. Returns `{ tables }` or `{ tables, error }` unchanged. */
export function assignGuest(tables, tableId, guestId) {
  const target = tables.find((table) => table.id === tableId);
  if (!target) return { tables, error: 'That table no longer exists.' };
  if (target.guestIds.includes(guestId)) return { tables };
  if (freeSeats(target) === 0) return { tables, error: `${target.name} is full.` };

  const cleared = unassignGuest(tables, guestId);
  return {
    tables: cleared.map((table) =>
      table.id === tableId ? { ...table, guestIds: [...table.guestIds, guestId] } : table
    ),
  };
}

export function unseatedGuests(tables, guests, event = null) {
  const seated = new Set(tables.flatMap((table) => table.guestIds));
  return seatableGuests(guests, event).filter((guest) => !seated.has(guest.id));
}

const pairKey = (a, b) => [a, b].sort().join('|');

export function findConflicts(tables, avoidPairs = []) {
  const avoid = new Set(avoidPairs.map(([a, b]) => pairKey(a, b)));
  const conflicts = [];
  for (const table of tables) {
    const ids = table.guestIds;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        if (avoid.has(pairKey(ids[i], ids[j]))) conflicts.push({ tableId: table.id, a: ids[i], b: ids[j] });
      }
    }
  }
  return conflicts;
}

function clashes(table, guestIds, avoid) {
  return guestIds.some((id) => table.guestIds.some((other) => avoid.has(pairKey(id, other))));
}

/**
 * Seat everyone not yet seated, keeping households together where they fit
 * and never seating an avoid-pair together. Existing seats are left alone.
 *
 * Largest households go first (they are hardest to place). Each goes to the
 * clash-free table with the most room that fits it whole; failing that, its
 * members are seated one by one wherever there is clash-free room.
 */
export function autoSeat(tables, guests, { avoidPairs = [], event = null } = {}) {
  const avoid = new Set(avoidPairs.map(([a, b]) => pairKey(a, b)));
  const next = tables.map((table) => ({ ...table, guestIds: [...table.guestIds] }));

  const groups = new Map();
  for (const guest of unseatedGuests(next, guests, event)) {
    const key = guest.householdId ?? guest.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(guest.id);
  }

  const ordered = [...groups.values()].sort((a, b) => b.length - a.length);
  const unplaced = [];
  let placed = 0;

  const roomiest = (ids) =>
    next
      .filter((table) => freeSeats(table) >= ids.length && !clashes(table, ids, avoid))
      .sort((a, b) => freeSeats(b) - freeSeats(a))[0];

  for (const group of ordered) {
    const whole = roomiest(group);
    if (whole) {
      whole.guestIds.push(...group);
      placed += group.length;
      continue;
    }
    for (const id of group) {
      const table = roomiest([id]);
      if (table) {
        table.guestIds.push(id);
        placed++;
      } else {
        unplaced.push(id);
      }
    }
  }

  return { tables: next, placed, unplaced };
}

export function seatingSummary(tables, guests, event = null) {
  const capacity = tables.reduce((sum, table) => sum + (table.capacity ?? 0), 0);
  const seated = tables.reduce((sum, table) => sum + table.guestIds.length, 0);
  return {
    tables: tables.length,
    capacity,
    seated,
    unseated: unseatedGuests(tables, guests, event).length,
    spare: Math.max(0, capacity - seated),
  };
}

export function guestLabel(guest) {
  return guestFullName(guest) || 'Unnamed guest';
}
