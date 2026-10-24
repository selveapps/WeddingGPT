import { normalizeContact, searchContacts } from '../weddingContactsModel';

describe('wedding contacts model', () => {
  const contacts = [
    { name: 'Mira', phone: '+91 98765', role: 'Planner', notes: 'Main coordinator' },
    { name: 'Lotus Hall', phone: '555-1234', role: 'Venue', notes: '' },
  ];
  test('requires name and phone', () => {
    expect(() => normalizeContact({ name: '', phone: '123' })).toThrow('contact name');
    expect(() => normalizeContact({ name: 'Mira', phone: '' })).toThrow('phone number');
  });
  test('normalizes whitespace', () => {
    expect(normalizeContact({ name: ' Mira ', phone: ' 123 ', role: ' Planner ' })).toMatchObject({ name: 'Mira', phone: '123', role: 'Planner', notes: '' });
  });
  test('searches across name, role, phone and notes', () => {
    expect(searchContacts(contacts, 'planner')).toHaveLength(1);
    expect(searchContacts(contacts, '555')).toHaveLength(1);
    expect(searchContacts(contacts, 'coordinator')).toHaveLength(1);
    expect(searchContacts(contacts, '')).toHaveLength(2);
  });
});
