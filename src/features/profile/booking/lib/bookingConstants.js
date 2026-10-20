/**
 * Static copy, status maps and filter vocab for the Booking tracker.
 *
 * Bookings sit under Profile because they are part of the couple's account
 * workspace - who is booked, for how much, and what still needs chasing -
 * rather than a marketplace browse experience.
 */

import { VendorStatus, VENDOR_STATUS_META, VENDOR_CATEGORIES } from '@/models';
import { VENDOR_STORAGE_KEY } from '@/store/vendorStore';

export const BOOKING_STORAGE_KEY = VENDOR_STORAGE_KEY;

export const BookingFilter = {
  ALL: 'all',
  NEEDS_ATTENTION: 'needs_attention',
  IN_PROGRESS: 'in_progress',
  BOOKED: 'booked',
  PASSED: 'passed',
};

export const BOOKING_FILTER_META = {
  [BookingFilter.ALL]: { label: 'All', description: 'Every vendor you are tracking.' },
  [BookingFilter.NEEDS_ATTENTION]: {
    label: 'Needs you',
    description: 'Saved or contacted - still waiting on a next step.',
  },
  [BookingFilter.IN_PROGRESS]: {
    label: 'In motion',
    description: 'Quotes and meetings on the go.',
  },
  [BookingFilter.BOOKED]: {
    label: 'Booked',
    description: 'Signed and locked in.',
  },
  [BookingFilter.PASSED]: {
    label: 'Closed',
    description: 'Passed or declined - kept for the record.',
  },
};

/** Statuses that count as "still need a decision". */
export const ATTENTION_STATUSES = [VendorStatus.SAVED, VendorStatus.CONTACTED];

/** Statuses that count as active pipeline. */
export const IN_PROGRESS_STATUSES = [
  VendorStatus.QUOTED,
  VendorStatus.MEETING_SCHEDULED,
];

/** Statuses that are done (won or lost). */
export const CLOSED_STATUSES = [
  VendorStatus.BOOKED,
  VendorStatus.DECLINED,
  VendorStatus.PASSED,
];

export const BOOKING_STATUS_OPTIONS = Object.entries(VENDOR_STATUS_META).map(
  ([value, meta]) => ({
    value,
    label: meta.label,
    tone: meta.tone,
  })
);

export const BOOKING_CATEGORY_OPTIONS = VENDOR_CATEGORIES.map((category) => ({
  value: category.key,
  label: category.name,
  icon: category.icon,
}));

export const BOOKING_SORT = {
  UPDATED: 'updated',
  NAME: 'name',
  STATUS: 'status',
  AMOUNT: 'amount',
  CATEGORY: 'category',
};

export const BOOKING_SORT_OPTIONS = [
  { value: BOOKING_SORT.UPDATED, label: 'Recently updated' },
  { value: BOOKING_SORT.NAME, label: 'Name' },
  { value: BOOKING_SORT.STATUS, label: 'Status' },
  { value: BOOKING_SORT.AMOUNT, label: 'Quoted amount' },
  { value: BOOKING_SORT.CATEGORY, label: 'Category' },
];

export const PAYMENT_MILESTONE_PRESETS = [
  { key: 'deposit', label: 'Deposit', defaultPercent: 25 },
  { key: 'second', label: 'Second payment', defaultPercent: 25 },
  { key: 'final', label: 'Final balance', defaultPercent: 50 },
];

export const BOOKING_COPY = {
  screenEyebrow: 'Vendors',
  screenTitle: 'Bookings',
  screenSubtitle: 'Who you are talking to, quoting and locking in.',
  heroEmptyTitle: 'No bookings yet',
  heroEmptyBody:
    'Save a venue, photographer or caterer here. Track quotes, meetings and what you have actually booked.',
  addLabel: 'Add booking',
  editLabel: 'Edit booking',
  saveLabel: 'Save booking',
  savingLabel: 'Saving…',
  deleteLabel: 'Remove booking',
  deleteConfirmTitle: 'Remove this booking?',
  deleteConfirmMessage:
    'Their name, quotes and notes will leave this list. Your budget expenses stay untouched.',
  deleteSuccess: 'Booking removed',
  saveSuccess: 'Booking saved',
  markBookedLabel: 'Mark as booked',
  markBookedSuccess: 'Marked as booked',
  filterEyebrow: 'Show',
  summaryEyebrow: 'Pipeline',
  summaryTitle: 'Where things stand',
  timelineEyebrow: 'When to book',
  timelineTitle: 'Booking windows',
  timelineSubtitle: 'Based on your wedding date and typical lead times.',
  categoriesEyebrow: 'By type',
  categoriesTitle: 'Categories',
  listEyebrow: 'Your list',
  listTitle: 'Tracked vendors',
  emptyFilteredTitle: 'Nothing in this view',
  emptyFilteredBody: 'Try another filter, or add a vendor to get started.',
  detailEyebrow: 'Booking',
  notesEyebrow: 'Remember',
  notesTitle: 'Notes',
  paymentsEyebrow: 'Money',
  paymentsTitle: 'Payment plan',
  paymentsEmpty: 'Add a quoted amount to sketch a simple deposit schedule.',
  contactEyebrow: 'Reach them',
  quickActionsTitle: 'Next steps',
  formEyebrowAdd: 'New booking',
  formEyebrowEdit: 'Edit booking',
  formTitleAdd: 'Add a vendor',
  formTitleEdit: 'Update booking',
  formSubtitle: 'A name and a category are enough to start. Fill the rest as you learn more.',
};

export const BOOKING_PLACEHOLDERS = {
  name: 'Bloom & Vine Florals',
  contactName: 'Priya',
  email: 'hello@example.com',
  phone: 'Optional',
  website: 'https://',
  city: 'Austin',
  notes: 'Loved their sample board. Ask about weekend availability.',
  scope: 'Full day coverage, two shooters, online gallery',
  priceHint: 'Rough band, e.g. mid-range',
};

export const EMPTY_BOOKING_VALUES = {
  name: '',
  categoryKey: 'photography',
  status: VendorStatus.SAVED,
  contactName: '',
  email: '',
  phone: '',
  website: '',
  city: '',
  notes: '',
  priceHint: '',
  quotedAmount: null,
  quoteScope: '',
  quoteValidUntil: null,
  meetingAt: null,
  depositAmount: null,
  depositDueAt: null,
  finalAmount: null,
  finalDueAt: null,
  bookedAt: null,
  rating: null,
};

export const BOOKING_TIPS = [
  {
    id: 'venue-first',
    categoryKey: 'venue',
    title: 'Lock the venue early',
    body: 'Most other vendors ask where you are celebrating before they quote.',
  },
  {
    id: 'photo-lead',
    categoryKey: 'photography',
    title: 'Photographers book out',
    body: 'Popular weekends go a year ahead. Shortlist three and meet two.',
  },
  {
    id: 'compare-quotes',
    categoryKey: null,
    title: 'Compare scope, not just price',
    body: 'A cheaper quote that skips overtime or second shooters can cost more later.',
  },
  {
    id: 'deposit',
    categoryKey: null,
    title: 'Get deposit terms in writing',
    body: 'Note the amount, due date and what happens if plans change.',
  },
  {
    id: 'one-booked',
    categoryKey: null,
    title: 'One booked is momentum',
    body: 'Mark the first yes. The list gets calmer when something is locked.',
  },
];

export const QUICK_ACTION_DEFS = [
  {
    id: 'contact',
    label: 'Mark contacted',
    status: VendorStatus.CONTACTED,
    icon: 'mail',
    from: [VendorStatus.SAVED],
  },
  {
    id: 'quoted',
    label: 'Got a quote',
    status: VendorStatus.QUOTED,
    icon: 'budget',
    from: [VendorStatus.SAVED, VendorStatus.CONTACTED, VendorStatus.MEETING_SCHEDULED],
  },
  {
    id: 'meeting',
    label: 'Meeting set',
    status: VendorStatus.MEETING_SCHEDULED,
    icon: 'calendar',
    from: [VendorStatus.SAVED, VendorStatus.CONTACTED, VendorStatus.QUOTED],
  },
  {
    id: 'book',
    label: 'Mark booked',
    status: VendorStatus.BOOKED,
    icon: 'check',
    from: [
      VendorStatus.SAVED,
      VendorStatus.CONTACTED,
      VendorStatus.QUOTED,
      VendorStatus.MEETING_SCHEDULED,
    ],
  },
  {
    id: 'pass',
    label: 'We passed',
    status: VendorStatus.PASSED,
    icon: 'close',
    from: [
      VendorStatus.SAVED,
      VendorStatus.CONTACTED,
      VendorStatus.QUOTED,
      VendorStatus.MEETING_SCHEDULED,
    ],
  },
];

export { VendorStatus, VENDOR_STATUS_META, VENDOR_CATEGORIES };
