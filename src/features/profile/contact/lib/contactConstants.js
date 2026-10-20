export const ContactFilter = {
  ALL: 'all',
  EMAIL: 'email',
  PHONE: 'phone',
  WEBSITE: 'website',
};

export const CONTACT_FILTER_OPTIONS = [
  { value: ContactFilter.ALL, label: 'All' },
  { value: ContactFilter.EMAIL, label: 'Email' },
  { value: ContactFilter.PHONE, label: 'Phone' },
  { value: ContactFilter.WEBSITE, label: 'Website' },
];

export const CONTACT_COPY = {
  eyebrow: 'Your people',
  title: 'Contacts',
  subtitle: 'A quick way back to the vendors you are working with.',
  searchLabel: 'Search contacts',
  searchPlaceholder: 'Name, vendor or city',
  emptyTitle: 'No vendor contacts yet',
  emptyMessage: 'Add contact details to a booking and they will be easy to find here.',
  noResultsTitle: 'No matching contacts',
  noResultsMessage: 'Try another name or choose a different contact method.',
  missingName: 'Vendor contact',
  openError: 'Could not open that contact link.',
};
