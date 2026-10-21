import {
  buildPaymentMilestones,
  filterBookings,
  getBookingCategory,
  sortBookings,
  summariseBookings,
} from '../bookingHelpers';
import { validateBookingField, validateBookingValues } from '../bookingValidation';
import { BOOKING_SORT } from '../bookingConstants';

const booking = (id, status, extra = {}) => ({ id, name: id, status, ...extra });

const bookings = [
  booking('Bloom', 'saved', { categoryKey: 'florals', updatedAt: '2027-01-02' }),
  booking('Abbey', 'booked', { categoryKey: 'venue', quotedAmount: 900000, updatedAt: '2027-01-05' }),
  booking('Cater Co', 'quoted', { categoryKey: 'catering', quotedAmount: 400000, updatedAt: '2027-01-01' }),
  booking('Duo', 'declined', { categoryKey: 'music', updatedAt: '2027-01-03' }),
  booking('Echo', 'contacted', { categoryKey: 'music', updatedAt: '2027-01-04' }),
];

const ids = (list) => list.map((item) => item.id);

describe('filterBookings', () => {
  it('groups statuses into filters', () => {
    expect(ids(filterBookings(bookings, 'needs_attention'))).toEqual(['Bloom', 'Echo']);
    expect(ids(filterBookings(bookings, 'in_progress'))).toEqual(['Cater Co']);
    expect(ids(filterBookings(bookings, 'booked'))).toEqual(['Abbey']);
    expect(ids(filterBookings(bookings, 'passed'))).toEqual(['Duo']);
  });

  it('returns everything for the all filter', () => {
    expect(filterBookings(bookings, 'all')).toBe(bookings);
  });
});

describe('sortBookings', () => {
  it('sorts by most recently updated by default', () => {
    expect(ids(sortBookings(bookings))).toEqual(['Abbey', 'Echo', 'Duo', 'Bloom', 'Cater Co']);
  });

  it('sorts by name, status, amount and category', () => {
    expect(ids(sortBookings(bookings, BOOKING_SORT.NAME))[0]).toBe('Abbey');
    expect(ids(sortBookings(bookings, BOOKING_SORT.STATUS))).toEqual([
      'Abbey',
      'Echo',
      'Duo',
      'Cater Co',
      'Bloom',
    ]);
    expect(ids(sortBookings(bookings, BOOKING_SORT.AMOUNT)).slice(0, 2)).toEqual(['Abbey', 'Cater Co']);
    expect(ids(sortBookings(bookings, BOOKING_SORT.CATEGORY))).toEqual([
      'Cater Co',
      'Bloom',
      'Duo',
      'Echo',
      'Abbey',
    ]);
  });

  it('does not mutate the input', () => {
    const before = ids(bookings);
    sortBookings(bookings, BOOKING_SORT.NAME);
    expect(ids(bookings)).toEqual(before);
  });
});

describe('summariseBookings', () => {
  it('counts each status group and totals booked spend', () => {
    expect(summariseBookings(bookings)).toEqual({
      total: 5,
      booked: 1,
      bookedAmount: 900000,
      needsAttention: 2,
      inProgress: 1,
    });
  });

  it('handles an empty list', () => {
    expect(summariseBookings([]).total).toBe(0);
  });
});

describe('getBookingCategory', () => {
  it('finds a category by key or returns null', () => {
    const categories = [{ key: 'venue', name: 'Venues' }];
    expect(getBookingCategory('venue', categories).name).toBe('Venues');
    expect(getBookingCategory('cake', categories)).toBeNull();
  });
});

describe('buildPaymentMilestones', () => {
  it('returns nothing without a quote', () => {
    expect(buildPaymentMilestones({})).toEqual([]);
    expect(buildPaymentMilestones(null)).toEqual([]);
  });

  it('derives the final balance from the quote and deposit', () => {
    const milestones = buildPaymentMilestones({
      quotedAmount: 500000,
      depositAmount: 100000,
      depositDueAt: '2027-02-01',
    });
    expect(milestones.map((m) => [m.id, m.amount])).toEqual([
      ['deposit', 100000],
      ['final', 400000],
    ]);
  });

  it('drops a deposit with no amount or date', () => {
    const milestones = buildPaymentMilestones({ quotedAmount: 500000 });
    expect(ids(milestones)).toEqual(['final']);
    expect(milestones[0].amount).toBe(500000);
  });
});

describe('validateBookingValues', () => {
  it('requires a vendor name', () => {
    expect(validateBookingValues({ name: '' }).errors.name).toBe('A vendor name is required.');
    expect(validateBookingValues({ name: 'Abbey' }).isValid).toBe(true);
  });

  it('checks contact details', () => {
    const { errors } = validateBookingValues({
      name: 'Abbey',
      email: 'abbey@',
      phone: '12',
      website: 'not a site',
    });
    expect(Object.keys(errors).sort()).toEqual(['email', 'phone', 'website']);
  });

  it('accepts websites with or without a scheme', () => {
    expect(validateBookingValues({ name: 'A', website: 'abbey.com' }).isValid).toBe(true);
    expect(validateBookingValues({ name: 'A', website: 'https://www.abbey.co.uk/weddings' }).isValid).toBe(true);
  });

  it('rejects negative or non-numeric amounts', () => {
    const { errors } = validateBookingValues({ name: 'A', quotedAmount: -1, depositAmount: NaN });
    expect(errors.quotedAmount).toBeDefined();
    expect(errors.depositAmount).toBeDefined();
  });

  it('keeps payment milestones within the quote', () => {
    const over = validateBookingValues({
      name: 'A',
      quotedAmount: 1000,
      depositAmount: 600,
      finalAmount: 500,
    });
    expect(over.errors.finalAmount).toBe('Payment milestones cannot exceed the quoted amount.');
    expect(
      validateBookingValues({ name: 'A', quotedAmount: 1000, depositAmount: 600, finalAmount: 400 }).isValid
    ).toBe(true);
  });
});

describe('validateBookingField', () => {
  it('validates single fields on blur', () => {
    expect(validateBookingField('name', '')).toBe('A vendor name is required.');
    expect(validateBookingField('website', 'abbey')).toBe('Enter a valid website address.');
    expect(validateBookingField('unknown', 'x')).toBeNull();
  });

  it('checks a milestone against the quote and the other milestone', () => {
    const values = { quotedAmount: 1000, finalAmount: 500 };
    expect(validateBookingField('depositAmount', 600, values)).toBe(
      'Payment milestones cannot exceed the quoted amount.'
    );
    expect(validateBookingField('depositAmount', 500, values)).toBeNull();
    expect(validateBookingField('quotedAmount', null, values)).toBeNull();
  });
});
