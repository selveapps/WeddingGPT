import { guestFullName } from '@/models/guests';

export const GuestColumn = {
  NAME: 'name',
  HOUSEHOLD: 'household',
  RSVP: 'rsvp',
  INVITATION: 'invitation',
};

function valueFor(guest, column, householdNameById) {
  switch (column) {
    case GuestColumn.HOUSEHOLD:
      return householdNameById.get(guest.householdId) || '';
    case GuestColumn.RSVP:
      return guest.rsvpStatus || '';
    case GuestColumn.INVITATION:
      return guest.invitationStatus || '';
    case GuestColumn.NAME:
    default:
      return guestFullName(guest);
  }
}

export function sortGuests(guests, sort = {}, householdNameById = new Map()) {
  const { column = GuestColumn.NAME, direction = 'asc' } = sort;
  const multiplier = direction === 'desc' ? -1 : 1;

  return [...guests].sort((a, b) => {
    const result = String(valueFor(a, column, householdNameById)).localeCompare(
      String(valueFor(b, column, householdNameById)),
      undefined,
      { sensitivity: 'base', numeric: true }
    );
    return result * multiplier;
  });
}
