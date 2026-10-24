import { cleanText, makeId } from './storage';

export const RSVP_STATUSES = ['Pending', 'Confirmed', 'Declined', 'Maybe'];
export const GUEST_GROUPS = ['Bride side', 'Groom side', 'Family', 'Friends', 'Colleagues', 'Other'];
export const MEAL_OPTIONS = ['Not specified', 'Vegetarian', 'Vegan', 'Jain', 'Non-vegetarian', 'Other'];

export function normalizeGuest(input = {}) {
  return {
    id: cleanText(input.id, 100) || makeId('guest'),
    name: cleanText(input.name, 120) || 'Unnamed guest',
    group: cleanText(input.group, 80) || 'Other',
    side: cleanText(input.side, 80),
    rsvp: RSVP_STATUSES.includes(input.rsvp) ? input.rsvp : 'Pending',
    plusOne: Boolean(input.plusOne),
    plusOneName: cleanText(input.plusOneName, 120),
    meal: MEAL_OPTIONS.includes(input.meal) ? input.meal : 'Not specified',
    dietaryNotes: cleanText(input.dietaryNotes, 240),
    phone: cleanText(input.phone, 60),
    email: cleanText(input.email, 160),
    tableId: cleanText(input.tableId, 100),
    inviteSent: Boolean(input.inviteSent),
    giftReceived: Boolean(input.giftReceived),
    notes: cleanText(input.notes, 400),
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: input.updatedAt || new Date().toISOString(),
  };
}

export function validateGuest(input = {}) {
  const errors = {};
  if (!cleanText(input.name, 120)) errors.name = 'Guest name is required.';
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(input.email).trim())) errors.email = 'Enter a valid email.';
  if (input.rsvp && !RSVP_STATUSES.includes(input.rsvp)) errors.rsvp = 'Choose a valid RSVP status.';
  if (input.plusOne && input.plusOneName && input.plusOneName.trim().length > 120) errors.plusOneName = 'Plus-one name is too long.';
  return errors;
}

export function addGuest(items, draft) {
  return [...items, normalizeGuest({ ...draft, id: makeId('guest') })];
}

export function updateGuest(items, id, patch) {
  return items.map((guest) => guest.id === id
    ? normalizeGuest({ ...guest, ...patch, id, updatedAt: new Date().toISOString() })
    : guest);
}

export function removeGuest(items, id) {
  return items.filter((guest) => guest.id !== id);
}

export function countGuestSeats(input) {
  const guest = normalizeGuest(input);
  if (guest.rsvp === 'Declined') return 0;
  return 1 + (guest.plusOne ? 1 : 0);
}

export function summarizeGuests(items = []) {
  const guests = items.map(normalizeGuest);
  const count = (status) => guests.filter((guest) => guest.rsvp === status).length;
  const eligible = guests.filter((guest) => guest.rsvp !== 'Declined');
  return {
    total: guests.length,
    pending: count('Pending'),
    confirmed: count('Confirmed'),
    declined: count('Declined'),
    maybe: count('Maybe'),
    confirmedSeats: guests.filter((guest) => guest.rsvp === 'Confirmed').reduce((sum, guest) => sum + countGuestSeats(guest), 0),
    possibleSeats: eligible.reduce((sum, guest) => sum + countGuestSeats(guest), 0),
    plusOnes: eligible.filter((guest) => guest.plusOne).length,
    invitationsSent: guests.filter((guest) => guest.inviteSent).length,
    invitationsRemaining: guests.filter((guest) => !guest.inviteSent).length,
    giftsReceived: guests.filter((guest) => guest.giftReceived).length,
  };
}

export function filterGuests(items = [], filters = {}) {
  const query = cleanText(filters.query, 100).toLowerCase();
  const rsvp = filters.rsvp || 'All';
  const group = filters.group || 'All';
  const invite = filters.invite || 'all';
  const meal = filters.meal || 'All';
  return items.map(normalizeGuest).filter((guest) => {
    const searchable = [guest.name, guest.group, guest.side, guest.phone, guest.email, guest.notes, guest.tableId, guest.plusOneName].join(' ').toLowerCase();
    return (!query || searchable.includes(query))
      && (rsvp === 'All' || guest.rsvp === rsvp)
      && (group === 'All' || guest.group === group)
      && (meal === 'All' || guest.meal === meal)
      && (invite === 'all' || (invite === 'sent' && guest.inviteSent) || (invite === 'not-sent' && !guest.inviteSent));
  });
}

export function groupGuests(items = []) {
  const groups = new Map();
  items.map(normalizeGuest).forEach((guest) => {
    const group = groups.get(guest.group) || { group: guest.group, total: 0, confirmed: 0, pending: 0, declined: 0 };
    group.total += 1;
    group[guest.rsvp.toLowerCase()] = (group[guest.rsvp.toLowerCase()] || 0) + 1;
    groups.set(guest.group, group);
  });
  return [...groups.values()].sort((a, b) => b.total - a.total);
}

export function exportGuestReport(items = []) {
  const summary = summarizeGuests(items);
  const lines = [
    'WEDDING GUEST LIST',
    `Total invited: ${summary.total}`,
    `Confirmed guests: ${summary.confirmed}`,
    `Pending responses: ${summary.pending}`,
    `Declined: ${summary.declined}`,
    `Possible seats incl. plus-ones: ${summary.possibleSeats}`,
    '',
    'Name | Group | RSVP | Plus one | Meal | Dietary notes | Table | Invite sent | Phone | Email',
  ];
  items.map(normalizeGuest).forEach((guest) => lines.push([
    guest.name, guest.group, guest.rsvp, guest.plusOne ? guest.plusOneName || 'Yes' : 'No',
    guest.meal, guest.dietaryNotes, guest.tableId || '-', guest.inviteSent ? 'Yes' : 'No',
    guest.phone, guest.email,
  ].join(' | ')));
  lines.push('', 'GROUP SUMMARY');
  groupGuests(items).forEach((group) => lines.push(`${group.group}: ${group.total} total, ${group.confirmed} confirmed, ${group.pending} pending`));
  return lines.join('\n');
}
