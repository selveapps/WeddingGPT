import {
  INVITATION_STATUS_META,
  MEAL_PREFERENCE_META,
  MealPreference,
  RSVP_STATUS_META,
  guestFullName,
} from '@/models';

/**
 * Columns and sorting for the wide-screen guest table.
 *
 * Sorting by status follows the order the statuses are defined in (attending
 * before declined), not the alphabet, which is how people scan a guest list.
 * Ties fall back to the name, so the order is stable.
 */

export const GuestColumn = {
  NAME: 'name',
  HOUSEHOLD: 'household',
  RSVP: 'rsvp',
  MEAL: 'meal',
  INVITATION: 'invitation',
  TAGS: 'tags',
};

export const GUEST_TABLE_COLUMNS = [
  { key: GuestColumn.NAME, label: 'Name', flex: 3 },
  { key: GuestColumn.HOUSEHOLD, label: 'Household', flex: 2 },
  { key: GuestColumn.RSVP, label: 'RSVP', flex: 2 },
  { key: GuestColumn.MEAL, label: 'Meal', flex: 2 },
  { key: GuestColumn.INVITATION, label: 'Invitation', flex: 2 },
  { key: GuestColumn.TAGS, label: 'Tags', flex: 2, sortable: false },
];

const statusOrder = (meta) => {
  const keys = Object.keys(meta);
  return (value) => {
    const index = keys.indexOf(value);
    return index === -1 ? keys.length : index;
  };
};

const rsvpRank = statusOrder(RSVP_STATUS_META);
const invitationRank = statusOrder(INVITATION_STATUS_META);

export function mealLabel(guest) {
  if (!guest.mealPreference || guest.mealPreference === MealPreference.UNSPECIFIED) return '';
  return MEAL_PREFERENCE_META[guest.mealPreference]?.label ?? '';
}

/**
 * Sort a copy of `guests`. Empty households and meals sort last whichever the
 * direction, so the gaps stay out of the way.
 */
export function sortGuests(
  guests,
  { column = GuestColumn.NAME, direction = 'asc' } = {},
  householdNameById = new Map()
) {
  const flip = direction === 'desc' ? -1 : 1;
  const byName = (a, b) => guestFullName(a).localeCompare(guestFullName(b));

  const compareText = (getText) => (a, b) => {
    const left = getText(a);
    const right = getText(b);
    if (!left && right) return 1;
    if (left && !right) return -1;
    return flip * left.localeCompare(right) || byName(a, b);
  };

  const compareRank = (getRank) => (a, b) => flip * (getRank(a) - getRank(b)) || byName(a, b);

  const comparators = {
    [GuestColumn.NAME]: (a, b) => flip * byName(a, b),
    [GuestColumn.HOUSEHOLD]: compareText((guest) => householdNameById.get(guest.householdId) ?? ''),
    [GuestColumn.MEAL]: compareText(mealLabel),
    [GuestColumn.RSVP]: compareRank((guest) => rsvpRank(guest.rsvpStatus)),
    [GuestColumn.INVITATION]: compareRank((guest) => invitationRank(guest.invitationStatus)),
  };

  return [...guests].sort(comparators[column] ?? comparators[GuestColumn.NAME]);
}

/** Clicking a header: a new column sorts ascending, the same column flips. */
export function nextSort(current, column) {
  if (current.column !== column) return { column, direction: 'asc' };
  return { column, direction: current.direction === 'asc' ? 'desc' : 'asc' };
}

/** Select-all checkbox state for the visible rows. */
export function selectionState(visibleIds, selectedIds) {
  const selected = visibleIds.filter((id) => selectedIds.includes(id)).length;
  if (selected === 0) return 'none';
  return selected === visibleIds.length ? 'all' : 'some';
}
