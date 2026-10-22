import { RsvpStatus, guestFullName } from '@/models';

/**
 * Seating chart (Labs).
 *
 * Tables are `{ id, name, capacity, guestIds }`. Guests come from the real
 * guest store and are only ever referenced by ID, so editing a guest's name
 * shows up on the chart immediately. Everything here is pure; the store just
 * persists what these functions return.
 */

export const DEFAULT_TABLE_CAPACITY = 8;

/** Anyone not declined still needs a seat on the plan. */
export function seatableGuests(guests = []) {
  return guests.filter((guest) => guest.rsvpStatus !== RsvpStatus.DECLINED);
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

export function unseatedGuests(tables, guests) {
  const seated = new Set(tables.flatMap((table) => table.guestIds));
  return seatableGuests(guests).filter((guest) => !seated.has(guest.id));
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
export function autoSeat(tables, guests, { avoidPairs = [] } = {}) {
  const avoid = new Set(avoidPairs.map(([a, b]) => pairKey(a, b)));
  const next = tables.map((table) => ({ ...table, guestIds: [...table.guestIds] }));

  const groups = new Map();
  for (const guest of unseatedGuests(next, guests)) {
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

export function seatingSummary(tables, guests) {
  const capacity = tables.reduce((sum, table) => sum + (table.capacity ?? 0), 0);
  const seated = tables.reduce((sum, table) => sum + table.guestIds.length, 0);
  return {
    tables: tables.length,
    capacity,
    seated,
    unseated: unseatedGuests(tables, guests).length,
    spare: Math.max(0, capacity - seated),
  };
}

export function guestLabel(guest) {
  return guestFullName(guest) || 'Unnamed guest';
}
