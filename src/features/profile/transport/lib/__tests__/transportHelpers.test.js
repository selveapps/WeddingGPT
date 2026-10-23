import {
  normalizeTransport,
  searchTransport,
  sortTransport,
  summarizeTransport,
  validateTransport,
} from '../transportHelpers';

describe('transport helpers', () => {
  it('requires route, pickup, provider, valid time and positive capacity', () => {
    expect(
      validateTransport({ route: '', pickup: '', provider: '', time: '99:70', capacity: '0' }).isValid
    ).toBe(false);
    expect(
      validateTransport({
        route: 'Hotel to venue',
        pickup: 'Lobby',
        provider: 'City Cars',
        time: '16:30',
        capacity: '24',
      }).isValid
    ).toBe(true);
  });

  it('normalizes, searches, sorts and totals capacity', () => {
    const records = [
      normalizeTransport({
        route: 'Venue return',
        pickup: 'Hall',
        provider: 'A Cars',
        time: '23:00',
        capacity: '20',
        status: 'confirmed',
      }),
      normalizeTransport({
        route: 'Hotel shuttle',
        pickup: 'Lobby',
        provider: 'B Cars',
        time: '09:00',
        capacity: '12',
      }),
    ];
    expect(searchTransport(records, 'lobby')).toHaveLength(1);
    expect(sortTransport(records)[0].route).toBe('Hotel shuttle');
    expect(summarizeTransport(records)).toEqual({ routes: 2, confirmed: 1, seats: 32 });
  });
});
