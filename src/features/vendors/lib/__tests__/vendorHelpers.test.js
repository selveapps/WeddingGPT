import {
  contactUrl,
  filterVendors,
  searchVendors,
  sortVendors,
  summariseVendorList,
  vendorCategory,
} from '../vendorHelpers';
import { validateVendorField, validateVendorValues } from '../vendorValidation';
import { VENDOR_SORT } from '../vendorConstants';

const booking = (id, status, extra = {}) => ({ id, name: id, status, ...extra });

const bookings = [
  booking('Bloom', 'saved', { categoryKey: 'florals', updatedAt: '2027-01-02' }),
  booking('Abbey', 'booked', { categoryKey: 'venue', quotedAmount: 900000, updatedAt: '2027-01-05' }),
  booking('Cater Co', 'quoted', { categoryKey: 'catering', quotedAmount: 400000, updatedAt: '2027-01-01' }),
  booking('Duo', 'declined', { categoryKey: 'music', updatedAt: '2027-01-03' }),
  booking('Echo', 'contacted', { categoryKey: 'music', updatedAt: '2027-01-04' }),
];

const ids = (list) => list.map((item) => item.id);

describe('filterVendors', () => {
  it('groups statuses into filters', () => {
    expect(ids(filterVendors(bookings, 'needs_attention'))).toEqual(['Bloom', 'Echo']);
    expect(ids(filterVendors(bookings, 'in_progress'))).toEqual(['Cater Co']);
    expect(ids(filterVendors(bookings, 'booked'))).toEqual(['Abbey']);
    expect(ids(filterVendors(bookings, 'passed'))).toEqual(['Duo']);
  });

  it('returns everything for the all filter', () => {
    expect(filterVendors(bookings, 'all')).toBe(bookings);
  });
});

describe('sortVendors', () => {
  it('sorts by most recently updated by default', () => {
    expect(ids(sortVendors(bookings))).toEqual(['Abbey', 'Echo', 'Duo', 'Bloom', 'Cater Co']);
  });

  it('sorts by name, status, amount and category', () => {
    expect(ids(sortVendors(bookings, VENDOR_SORT.NAME))[0]).toBe('Abbey');
    expect(ids(sortVendors(bookings, VENDOR_SORT.STATUS))).toEqual([
      'Abbey',
      'Echo',
      'Duo',
      'Cater Co',
      'Bloom',
    ]);
    expect(ids(sortVendors(bookings, VENDOR_SORT.AMOUNT)).slice(0, 2)).toEqual(['Abbey', 'Cater Co']);
    expect(ids(sortVendors(bookings, VENDOR_SORT.CATEGORY))).toEqual([
      'Cater Co',
      'Bloom',
      'Duo',
      'Echo',
      'Abbey',
    ]);
  });

  it('does not mutate the input', () => {
    const before = ids(bookings);
    sortVendors(bookings, VENDOR_SORT.NAME);
    expect(ids(bookings)).toEqual(before);
  });
});

describe('summariseVendorList', () => {
  it('counts each status group and totals booked money', () => {
    expect(summariseVendorList(bookings)).toEqual({
      total: 5,
      booked: 1,
      bookedAmount: 900000,
      paid: 0,
      outstanding: 900000,
      needsAttention: 2,
      inProgress: 1,
    });
  });

  it('counts paid payments for booked vendors only', () => {
    const paid = [
      booking('Paid', 'booked', {
        quotedAmount: 1000,
        payments: [
          { id: 'deposit', amount: 300, paidAt: '2027-01-01T00:00:00.000Z' },
          { id: 'balance', amount: 700, paidAt: null },
        ],
      }),
      booking('Quoted', 'quoted', {
        quotedAmount: 5000,
        payments: [{ id: 'deposit', amount: 500, paidAt: '2027-01-01T00:00:00.000Z' }],
      }),
    ];
    expect(summariseVendorList(paid)).toMatchObject({ bookedAmount: 1000, paid: 300, outstanding: 700 });
  });

  it('handles an empty list', () => {
    expect(summariseVendorList([]).total).toBe(0);
  });
});

describe('searchVendors', () => {
  it('matches name, contact, city and notes, ignoring case', () => {
    const list = [
      booking('Abbey', 'saved', { contactName: 'Jo', city: 'Austin' }),
      booking('Bloom', 'saved', { notes: 'Peonies in June' }),
    ];
    expect(ids(searchVendors(list, 'abbey'))).toEqual(['Abbey']);
    expect(ids(searchVendors(list, 'JO'))).toEqual(['Abbey']);
    expect(ids(searchVendors(list, 'austin'))).toEqual(['Abbey']);
    expect(ids(searchVendors(list, 'peonies'))).toEqual(['Bloom']);
  });

  it('returns everything for a blank query', () => {
    expect(searchVendors(bookings, '  ')).toBe(bookings);
    expect(searchVendors(bookings, undefined)).toBe(bookings);
  });
});

describe('vendorCategory', () => {
  it('finds a category by key or returns null', () => {
    expect(vendorCategory('venue').name).toBe('Venues');
    expect(vendorCategory('nope')).toBeNull();
  });
});

describe('contactUrl', () => {
  it('builds mail, phone and website links', () => {
    expect(contactUrl('a@b.co', 'mailto')).toBe('mailto:a@b.co');
    expect(contactUrl('555 0100', 'tel')).toBe('tel:555 0100');
    expect(contactUrl('abbey.com', 'website')).toBe('https://abbey.com');
    expect(contactUrl('http://abbey.com', 'website')).toBe('http://abbey.com');
  });
});

describe('validateVendorValues', () => {
  it('requires a vendor name', () => {
    expect(validateVendorValues({ name: '' }).errors.name).toBe('A vendor name is required.');
    expect(validateVendorValues({ name: 'Abbey' }).isValid).toBe(true);
  });

  it('checks contact details', () => {
    const { errors } = validateVendorValues({
      name: 'Abbey',
      email: 'abbey@',
      phone: '12',
      website: 'not a site',
    });
    expect(Object.keys(errors).sort()).toEqual(['email', 'phone', 'website']);
  });

  it('accepts websites with or without a scheme', () => {
    expect(validateVendorValues({ name: 'A', website: 'abbey.com' }).isValid).toBe(true);
    expect(validateVendorValues({ name: 'A', website: 'https://www.abbey.co.uk/weddings' }).isValid).toBe(
      true
    );
  });

  it('rejects negative or non-numeric amounts', () => {
    const { errors } = validateVendorValues({ name: 'A', quotedAmount: -1, depositAmount: NaN });
    expect(errors.quotedAmount).toBeDefined();
    expect(errors.depositAmount).toBeDefined();
  });

  it('keeps payment milestones within the quote', () => {
    const over = validateVendorValues({
      name: 'A',
      quotedAmount: 1000,
      depositAmount: 600,
      finalAmount: 500,
    });
    expect(over.errors.finalAmount).toBe('Payment milestones cannot exceed the quoted amount.');
    expect(
      validateVendorValues({ name: 'A', quotedAmount: 1000, depositAmount: 600, finalAmount: 400 }).isValid
    ).toBe(true);
  });
});

describe('validateVendorField', () => {
  it('validates single fields on blur', () => {
    expect(validateVendorField('name', '')).toBe('A vendor name is required.');
    expect(validateVendorField('website', 'abbey')).toBe('Enter a valid website address.');
    expect(validateVendorField('unknown', 'x')).toBeNull();
  });

  it('checks a milestone against the quote and the other milestone', () => {
    const values = { quotedAmount: 1000, finalAmount: 500 };
    expect(validateVendorField('depositAmount', 600, values)).toBe(
      'Payment milestones cannot exceed the quoted amount.'
    );
    expect(validateVendorField('depositAmount', 500, values)).toBeNull();
    expect(validateVendorField('quotedAmount', null, values)).toBeNull();
  });
});
