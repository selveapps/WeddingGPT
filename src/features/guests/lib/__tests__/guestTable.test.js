import { GuestColumn, mealLabel, nextSort, selectionState, sortGuests } from '../guestTable';
import { InvitationStatus, MealPreference, RsvpStatus } from '@/models';
import { breakpointFor, BREAKPOINTS } from '@/design-system/theme/useBreakpoint';
import { datedFilename } from '@/services/files';

const guest = (id, firstName, extra = {}) => ({ id, firstName, lastName: '', ...extra });

const guests = [
  guest('c', 'Cara', {
    rsvpStatus: RsvpStatus.DECLINED,
    householdId: 'h2',
    mealPreference: MealPreference.VEGAN,
    invitationStatus: InvitationStatus.NOT_SENT,
  }),
  guest('a', 'Ana', { rsvpStatus: RsvpStatus.ATTENDING, invitationStatus: InvitationStatus.INVITED }),
  guest('b', 'Ben', {
    rsvpStatus: RsvpStatus.PENDING,
    householdId: 'h1',
    mealPreference: MealPreference.STANDARD,
    invitationStatus: InvitationStatus.NOT_SENT,
  }),
  guest('d', 'Dev', {
    rsvpStatus: RsvpStatus.ATTENDING,
    householdId: 'h1',
    invitationStatus: InvitationStatus.REMINDED,
  }),
];
const households = new Map([
  ['h1', 'The Ahmeds'],
  ['h2', 'The Zhangs'],
]);
const ids = (list) => list.map((g) => g.id);

describe('sortGuests', () => {
  it('sorts by name both ways without changing the input', () => {
    expect(ids(sortGuests(guests))).toEqual(['a', 'b', 'c', 'd']);
    expect(ids(sortGuests(guests, { column: GuestColumn.NAME, direction: 'desc' }))).toEqual([
      'd',
      'c',
      'b',
      'a',
    ]);
    expect(ids(guests)).toEqual(['c', 'a', 'b', 'd']);
  });

  it('sorts statuses in their defined order, then by name', () => {
    // Defined order: awaiting reply, attending, declined, ...
    expect(ids(sortGuests(guests, { column: GuestColumn.RSVP }))).toEqual(['b', 'a', 'd', 'c']);
    expect(ids(sortGuests(guests, { column: GuestColumn.INVITATION }))).toEqual(['b', 'c', 'a', 'd']);
  });

  it('keeps guests without a household or meal last in both directions', () => {
    expect(ids(sortGuests(guests, { column: GuestColumn.HOUSEHOLD }, households))).toEqual([
      'b',
      'd',
      'c',
      'a',
    ]);
    expect(ids(sortGuests(guests, { column: GuestColumn.HOUSEHOLD, direction: 'desc' }, households))).toEqual(
      ['c', 'b', 'd', 'a']
    );
    expect(ids(sortGuests(guests, { column: GuestColumn.MEAL })).slice(-2)).toEqual(['a', 'd']);
  });

  it('falls back to name for an unknown column', () => {
    expect(ids(sortGuests(guests, { column: 'nope' }))).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('table helpers', () => {
  it('cycles the sort when a header is clicked', () => {
    const byName = { column: GuestColumn.NAME, direction: 'asc' };
    expect(nextSort(byName, GuestColumn.NAME)).toEqual({ column: GuestColumn.NAME, direction: 'desc' });
    expect(nextSort({ ...byName, direction: 'desc' }, GuestColumn.NAME).direction).toBe('asc');
    expect(nextSort(byName, GuestColumn.RSVP)).toEqual({ column: GuestColumn.RSVP, direction: 'asc' });
  });

  it('reports the select-all state for the visible rows', () => {
    expect(selectionState(['a', 'b'], [])).toBe('none');
    expect(selectionState(['a', 'b'], ['a', 'x'])).toBe('some');
    expect(selectionState(['a', 'b'], ['b', 'a'])).toBe('all');
  });

  it('labels meals, leaving unspecified blank', () => {
    expect(mealLabel({ mealPreference: MealPreference.GLUTEN_FREE })).toBe('Gluten free');
    expect(mealLabel({ mealPreference: MealPreference.UNSPECIFIED })).toBe('');
    expect(mealLabel({})).toBe('');
  });
});

describe('breakpointFor', () => {
  it('switches to the wide layout at the breakpoint', () => {
    expect(breakpointFor(BREAKPOINTS.wide - 1).isWide).toBe(false);
    expect(breakpointFor(BREAKPOINTS.wide).isWide).toBe(true);
  });
});

describe('datedFilename', () => {
  it('stamps the local date', () => {
    expect(datedFilename('guest-list', 'csv', new Date(2027, 0, 4))).toBe('guest-list-2027-01-04.csv');
  });
});
