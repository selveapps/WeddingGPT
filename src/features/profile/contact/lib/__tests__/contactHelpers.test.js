import {
  countContactMethods,
  hasContactDetails,
  matchesContactFilter,
  searchContacts,
  sortContacts,
} from '../contactHelpers';
import { ContactFilter } from '../contactConstants';

const contacts = [
  { id: 'v1', name: 'Abbey Hall', categoryKey: 'venue', email: 'hello@abbey.com', city: 'Austin' },
  { id: 'v2', name: 'Snap Studio', contactName: 'Jo Lee', categoryKey: 'photography', phone: '555 0100' },
  { id: 'v3', name: 'Bloom', contactName: 'Ana', website: 'bloom.co' },
  { id: 'v4', name: 'Quiet Co' },
];

const ids = (list) => list.map((item) => item.id);

describe('hasContactDetails', () => {
  it('needs an email, phone or website', () => {
    expect(hasContactDetails(contacts[0])).toBe(true);
    expect(hasContactDetails(contacts[3])).toBe(false);
    expect(hasContactDetails(null)).toBe(false);
  });
});

describe('matchesContactFilter', () => {
  it('filters by contact method', () => {
    expect(ids(contacts.filter((c) => matchesContactFilter(c, ContactFilter.EMAIL)))).toEqual(['v1']);
    expect(ids(contacts.filter((c) => matchesContactFilter(c, ContactFilter.PHONE)))).toEqual(['v2']);
    expect(ids(contacts.filter((c) => matchesContactFilter(c, ContactFilter.WEBSITE)))).toEqual(['v3']);
    expect(contacts.filter((c) => matchesContactFilter(c, ContactFilter.ALL))).toHaveLength(4);
  });
});

describe('searchContacts', () => {
  it('returns everything for a blank query', () => {
    expect(searchContacts(contacts, '   ')).toBe(contacts);
  });

  it('matches names, details and city case-insensitively', () => {
    expect(ids(searchContacts(contacts, 'ABBEY'))).toEqual(['v1']);
    expect(ids(searchContacts(contacts, 'jo lee'))).toEqual(['v2']);
    expect(ids(searchContacts(contacts, '0100'))).toEqual(['v2']);
    expect(ids(searchContacts(contacts, 'austin'))).toEqual(['v1']);
  });

  it('matches the category name', () => {
    expect(ids(searchContacts(contacts, 'photography'))).toEqual(['v2']);
    expect(ids(searchContacts(contacts, 'venues'))).toEqual(['v1']);
  });
});

describe('sortContacts', () => {
  it('sorts by contact name, falling back to the business name', () => {
    expect(ids(sortContacts(contacts))).toEqual(['v1', 'v3', 'v2', 'v4']);
  });

  it('does not mutate the input', () => {
    sortContacts(contacts);
    expect(ids(contacts)).toEqual(['v1', 'v2', 'v3', 'v4']);
  });
});

describe('countContactMethods', () => {
  it('counts each method independently', () => {
    expect(countContactMethods(contacts)).toEqual({ email: 1, phone: 1, website: 1 });
    expect(countContactMethods([])).toEqual({ email: 0, phone: 0, website: 0 });
  });
});
