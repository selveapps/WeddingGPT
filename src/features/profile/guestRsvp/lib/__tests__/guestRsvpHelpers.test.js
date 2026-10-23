import {
  filterGuestRsvps,
  normaliseGuestRsvp,
  summariseGuestRsvps,
  validateGuestRsvp,
} from '../guestRsvpHelpers';

describe('guest RSVP helpers', () => {
  it('validates and normalizes guest records', () => {
    expect(validateGuestRsvp({ name: ' Ada ', rsvp: 'yes', partySize: '2' }).isValid).toBe(true);
    expect(normaliseGuestRsvp({ name: ' Ada ', rsvp: 'yes', partySize: '2' }).name).toBe('Ada');
    expect(validateGuestRsvp({ name: '', partySize: 0, rsvp: 'maybe' }).isValid).toBe(false);
  });
  it('filters and summarizes party counts', () => {
    const guests = [
      { name: 'Ada', rsvp: 'yes', partySize: 2 },
      { name: 'Sam', rsvp: 'pending', partySize: 1 },
    ];
    expect(filterGuestRsvps(guests, 'yes', 'ad')).toHaveLength(1);
    expect(summariseGuestRsvps(guests)).toMatchObject({ yes: 2, pending: 1, guests: 2 });
  });
});
