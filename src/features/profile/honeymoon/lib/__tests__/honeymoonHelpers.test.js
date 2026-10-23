import {
  normalizeItineraryItem,
  searchItinerary,
  sortItinerary,
  summarizeItinerary,
  validateItineraryItem,
} from '../honeymoonHelpers';

describe('honeymoon helpers', () => {
  it('validates destination and date/time safely', () => {
    expect(
      validateItineraryItem({ item: 'Dinner', destination: '', date: 'tomorrow', time: '25:80' }).isValid
    ).toBe(false);
    expect(
      validateItineraryItem({ item: 'Dinner', destination: 'Kyoto', date: '2027-05-02', time: '19:30' })
        .isValid
    ).toBe(true);
  });

  it('normalizes and sorts searchable itinerary items', () => {
    const records = [
      normalizeItineraryItem({ item: 'Tea', destination: 'Kyoto', date: '2027-05-04', status: 'booked' }),
      normalizeItineraryItem({ item: 'Flight', destination: 'Tokyo', date: '2027-05-01' }),
    ];
    expect(searchItinerary(records, 'kyoto')).toHaveLength(1);
    expect(sortItinerary(records)[0].item).toBe('Flight');
    expect(summarizeItinerary(records)).toEqual({ total: 2, booked: 1, datesSet: 2 });
  });
});
