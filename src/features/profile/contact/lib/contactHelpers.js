import { VENDOR_CATEGORIES } from '@/models';

import { ContactFilter } from './contactConstants';

export function hasContactDetails(vendor) {
  return Boolean(vendor?.email || vendor?.phone || vendor?.website);
}

export function matchesContactFilter(vendor, filter) {
  switch (filter) {
    case ContactFilter.EMAIL:
      return Boolean(vendor.email);
    case ContactFilter.PHONE:
      return Boolean(vendor.phone);
    case ContactFilter.WEBSITE:
      return Boolean(vendor.website);
    default:
      return true;
  }
}

export function searchContacts(contacts, query) {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return contacts;

  return contacts.filter((vendor) =>
    [
      vendor.name,
      vendor.contactName,
      vendor.email,
      vendor.phone,
      vendor.website,
      vendor.city,
      VENDOR_CATEGORIES.find((category) => category.key === vendor.categoryKey)?.name,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase().includes(term))
  );
}

export function sortContacts(contacts) {
  return [...contacts].sort((a, b) => {
    const aName = a.contactName || a.name || '';
    const bName = b.contactName || b.name || '';
    return aName.localeCompare(bName) || (a.name ?? '').localeCompare(b.name ?? '');
  });
}

export function countContactMethods(contacts) {
  return contacts.reduce(
    (counts, contact) => {
      if (contact.email) counts.email += 1;
      if (contact.phone) counts.phone += 1;
      if (contact.website) counts.website += 1;
      return counts;
    },
    { email: 0, phone: 0, website: 0 }
  );
}
