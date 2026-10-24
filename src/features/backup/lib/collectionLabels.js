/** Human labels for known WeddingGPT collections */
export const COLLECTION_LABELS = {
  wedding: 'Wedding',
  tasks: 'Tasks / planning',
  guests: 'Guests',
  budget: 'Budget',
  expenses: 'Expenses',
  categories: 'Budget categories',
  vendors: 'Vendors',
  events: 'Events',
  seating: 'Seating',
  rsvp: 'RSVP',
  gifts: 'Gifts',
  packing: 'Packing',
  party: 'Wedding party',
  runOfShow: 'Run of show',
  website: 'Website',
  settings: 'Settings',
  attire: 'Attire',
  photos: 'Photos',
  music: 'Music',
};

export function labelForCollection(name) {
  return COLLECTION_LABELS[name] || name;
}
