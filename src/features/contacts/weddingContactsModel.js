/**
 * Wedding day & planning contacts — roles, urgency, share packs, offline directory.
 */

export const CONTACTS_STORAGE_KEY = 'tools:wedding-contacts:v2';

export const ContactRole = Object.freeze({
  VENDOR: 'vendor',
  FAMILY: 'family',
  WEDDING_PARTY: 'wedding_party',
  VENUE: 'venue',
  EMERGENCY: 'emergency',
  MEDICAL: 'medical',
  TRANSPORT: 'transport',
  OTHER: 'other',
});

export const ROLE_META = Object.freeze({
  [ContactRole.VENDOR]: { label: 'Vendor', color: 'brand' },
  [ContactRole.FAMILY]: { label: 'Family', color: 'success' },
  [ContactRole.WEDDING_PARTY]: { label: 'Wedding party', color: 'brand' },
  [ContactRole.VENUE]: { label: 'Venue', color: 'warning' },
  [ContactRole.EMERGENCY]: { label: 'Emergency', color: 'danger' },
  [ContactRole.MEDICAL]: { label: 'Medical', color: 'danger' },
  [ContactRole.TRANSPORT]: { label: 'Transport', color: 'neutral' },
  [ContactRole.OTHER]: { label: 'Other', color: 'neutral' },
});

export const ContactPriority = Object.freeze({
  CRITICAL: 'critical',
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
});

export function createId(prefix = 'ct') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyContactsState() {
  return {
    version: 2,
    contacts: [],
    groups: [
      { id: 'g-day', name: 'Day-of critical', contactIds: [] },
      { id: 'g-vendors', name: 'Vendors', contactIds: [] },
    ],
    notes: '',
    updatedAt: null,
  };
}

export function createContact(partial = {}) {
  return {
    id: createId(),
    name: '',
    role: ContactRole.OTHER,
    title: '',
    company: '',
    phone: '',
    phoneAlt: '',
    email: '',
    priority: ContactPriority.NORMAL,
    dayOf: false,
    notes: '',
    tags: [],
    ...partial,
  };
}

export function normaliseContactsState(raw) {
  const base = emptyContactsState();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    contacts: Array.isArray(raw.contacts) ? raw.contacts : [],
    groups: Array.isArray(raw.groups) && raw.groups.length ? raw.groups : base.groups,
  };
}

export function filterContacts(contacts, { query = '', role = null, dayOfOnly = false } = {}) {
  const q = String(query).trim().toLowerCase();
  return contacts.filter((c) => {
    if (dayOfOnly && !c.dayOf) return false;
    if (role && c.role !== role) return false;
    if (!q) return true;
    const hay = [c.name, c.title, c.company, c.phone, c.email, c.notes, ...(c.tags || [])]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

export function sortContacts(contacts) {
  const order = {
    [ContactPriority.CRITICAL]: 0,
    [ContactPriority.HIGH]: 1,
    [ContactPriority.NORMAL]: 2,
    [ContactPriority.LOW]: 3,
  };
  return [...contacts].sort((a, b) => {
    const pa = order[a.priority] ?? 9;
    const pb = order[b.priority] ?? 9;
    if (pa !== pb) return pa - pb;
    return String(a.name).localeCompare(String(b.name));
  });
}

export function contactsByRole(contacts = []) {
  const map = {};
  for (const c of contacts) {
    const r = c.role || ContactRole.OTHER;
    if (!map[r]) map[r] = [];
    map[r].push(c);
  }
  return map;
}

export function dayOfPack(contacts = []) {
  return sortContacts(contacts.filter((c) => c.dayOf || c.priority === ContactPriority.CRITICAL));
}

export function validateContact(contact) {
  const errors = {};
  if (!String(contact.name || '').trim()) errors.name = 'Name is required';
  if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    errors.email = 'Invalid email';
  }
  return errors;
}

export function exportContactsCsv(contacts = []) {
  const header = ['name', 'role', 'title', 'company', 'phone', 'email', 'priority', 'dayOf', 'notes'];
  const rows = contacts.map((c) =>
    header
      .map((h) => {
        const v = c[h];
        const s = v == null ? '' : String(v);
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(',')
  );
  return [header.join(','), ...rows].join('\n');
}

export function seedStarterContacts() {
  return [
    createContact({
      name: 'Venue coordinator',
      role: ContactRole.VENUE,
      priority: ContactPriority.CRITICAL,
      dayOf: true,
      title: 'On-site coordinator',
    }),
    createContact({
      name: 'Photographer',
      role: ContactRole.VENDOR,
      priority: ContactPriority.HIGH,
      dayOf: true,
    }),
    createContact({
      name: 'Best person',
      role: ContactRole.WEDDING_PARTY,
      priority: ContactPriority.HIGH,
      dayOf: true,
    }),
    createContact({
      name: 'Local emergency',
      role: ContactRole.EMERGENCY,
      priority: ContactPriority.CRITICAL,
      dayOf: true,
      phone: '112',
      notes: 'Confirm local emergency number for venue city',
    }),
  ];
}

export function contactStats(contacts = []) {
  return {
    total: contacts.length,
    dayOf: contacts.filter((c) => c.dayOf).length,
    critical: contacts.filter((c) => c.priority === ContactPriority.CRITICAL).length,
    missingPhone: contacts.filter((c) => !c.phone).length,
  };
}

export default {
  CONTACTS_STORAGE_KEY,
  emptyContactsState,
  createContact,
  filterContacts,
  sortContacts,
  dayOfPack,
  exportContactsCsv,
  seedStarterContacts,
  contactStats,
};
