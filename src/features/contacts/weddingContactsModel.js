export const CONTACT_ROLES = ['Venue', 'Planner', 'Photographer', 'Caterer', 'Transport', 'Medical', 'Family', 'Other'];

export function normalizeContact(contact) {
  const name = String(contact.name ?? '').trim();
  const phone = String(contact.phone ?? '').trim();
  const role = String(contact.role ?? 'Other').trim() || 'Other';
  if (!name) throw new Error('Enter the contact name.');
  if (!phone) throw new Error('Enter a phone number.');
  return { ...contact, name, phone, role, notes: String(contact.notes ?? '').trim() };
}

export function searchContacts(contacts = [], query = '') {
  const normalized = String(query).trim().toLowerCase();
  if (!normalized) return contacts;
  return contacts.filter((contact) => [contact.name, contact.phone, contact.role, contact.notes].some((value) => String(value ?? '').toLowerCase().includes(normalized)));
}
