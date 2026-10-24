import { cleanText, makeId } from './storage';
import { normalizeGuest } from './guestModel';

export function normalizeTable(input = {}) {
  const capacity = Math.round(Number(input.capacity));
  return {
    id: cleanText(input.id, 100) || makeId('table'),
    name: cleanText(input.name, 80) || 'Untitled table',
    capacity: Number.isFinite(capacity) ? Math.max(1, Math.min(30, capacity)) : 8,
    location: cleanText(input.location, 120),
    notes: cleanText(input.notes, 300),
    guestIds: Array.isArray(input.guestIds) ? [...new Set(input.guestIds.map((id) => cleanText(id, 100)).filter(Boolean))] : [],
  };
}

export function addTable(items, draft) {
  return [...items, normalizeTable({ ...draft, id: makeId('table'), guestIds: [] })];
}

export function updateTable(items, id, patch) {
  return items.map((table) => table.id === id ? normalizeTable({ ...table, ...patch, id }) : table);
}

export function removeTable(items, id) {
  return items.filter((table) => table.id !== id);
}

export function assignGuest(tables, guests, guestId, tableId) {
  const guest = guests.find((item) => item.id === guestId);
  const target = tables.find((item) => item.id === tableId);
  if (!guest) return { error: 'Guest not found.', tables, guests };
  if (!target) return { error: 'Table not found.', tables, guests };
  if (normalizeGuest(guest).rsvp === 'Declined') return { error: 'Declined guests cannot be seated.', tables, guests };
  const existingTable = tables.find((table) => table.guestIds.includes(guestId));
  if (existingTable?.id === tableId) return { error: null, tables, guests };
  if (target.guestIds.length >= target.capacity) return { error: `${target.name} has no empty seats.`, tables, guests };
  const nextTables = tables.map((table) => {
    const without = table.guestIds.filter((id) => id !== guestId);
    return table.id === tableId ? { ...table, guestIds: [...without, guestId] } : { ...table, guestIds: without };
  });
  const nextGuests = guests.map((item) => item.id === guestId ? { ...item, tableId } : item);
  return { error: null, tables: nextTables, guests: nextGuests };
}

export function unassignGuest(tables, guests, guestId) {
  return {
    tables: tables.map((table) => ({ ...table, guestIds: table.guestIds.filter((id) => id !== guestId) })),
    guests: guests.map((guest) => guest.id === guestId ? { ...guest, tableId: '' } : guest),
  };
}

export function getSeatingSummary(tables = [], guests = []) {
  const normalizedTables = tables.map(normalizeTable);
  const activeGuests = guests.map(normalizeGuest).filter((guest) => guest.rsvp !== 'Declined');
  const assignedIds = new Set(normalizedTables.flatMap((table) => table.guestIds));
  const capacity = normalizedTables.reduce((sum, table) => sum + table.capacity, 0);
  const occupied = normalizedTables.reduce((sum, table) => sum + table.guestIds.length, 0);
  return {
    tableCount: normalizedTables.length,
    capacity,
    occupied,
    seatsAvailable: Math.max(0, capacity - occupied),
    unassignedCount: activeGuests.filter((guest) => !assignedIds.has(guest.id)).length,
    overCapacityTables: normalizedTables.filter((table) => table.guestIds.length > table.capacity).map((table) => table.id),
  };
}

export function validateSeating(tables = [], guests = []) {
  const errors = [];
  const assigned = new Map();
  const guestById = new Map(guests.map((guest) => [guest.id, normalizeGuest(guest)]));
  tables.map(normalizeTable).forEach((table) => {
    if (table.guestIds.length > table.capacity) errors.push(`${table.name} exceeds its ${table.capacity}-seat capacity.`);
    table.guestIds.forEach((id) => {
      if (!guestById.has(id)) errors.push(`${table.name} contains an unknown guest (${id}).`);
      if (assigned.has(id)) errors.push(`${guestById.get(id)?.name || id} is assigned to more than one table.`);
      assigned.set(id, table.id);
    });
  });
  return errors;
}

export function suggestTableForGuest(tables, guestId) {
  const available = tables.map(normalizeTable)
    .filter((table) => !table.guestIds.includes(guestId) && table.guestIds.length < table.capacity)
    .sort((a, b) => (a.capacity - a.guestIds.length) - (b.capacity - b.guestIds.length));
  return available[0] || null;
}

export function exportSeatingPlan(tables = [], guests = []) {
  const guestById = new Map(guests.map((guest) => [guest.id, normalizeGuest(guest)]));
  const lines = ['WEDDING SEATING PLAN', ''];
  tables.map(normalizeTable).forEach((table) => {
    lines.push(`${table.name} — ${table.guestIds.length}/${table.capacity}${table.location ? ` — ${table.location}` : ''}`);
    table.guestIds.forEach((id) => lines.push(`  • ${guestById.get(id)?.name || `Unknown guest (${id})`}`));
    if (table.notes) lines.push(`  Notes: ${table.notes}`);
    lines.push('');
  });
  const assigned = new Set(tables.flatMap((table) => table.guestIds));
  const unassigned = guests.map(normalizeGuest).filter((guest) => guest.rsvp !== 'Declined' && !assigned.has(guest.id));
  if (unassigned.length) {
    lines.push('UNASSIGNED GUESTS');
    unassigned.forEach((guest) => lines.push(`  • ${guest.name} (${guest.rsvp})`));
  }
  return lines.join('\n').trim();
}
