/**
 * Static copy, status groups and filter vocab for the Vendors screens.
 *
 * Vendors are the couple's own shortlist - who they are talking to, what was
 * quoted, what is booked and what is still owed - rather than a marketplace
 * browse experience. Discovery lives in Home > Venues and vendors.
 */

import { VendorStatus, VENDOR_STATUS_META, VENDOR_CATEGORIES } from '@/models';

export const VendorFilter = {
  ALL: 'all',
  NEEDS_ATTENTION: 'needs_attention',
  IN_PROGRESS: 'in_progress',
  BOOKED: 'booked',
  PASSED: 'passed',
};

export const VENDOR_FILTER_META = {
  [VendorFilter.ALL]: { label: 'All', description: 'Every vendor you are tracking.' },
  [VendorFilter.NEEDS_ATTENTION]: {
    label: 'Needs you',
    description: 'Saved or contacted - still waiting on a next step.',
  },
  [VendorFilter.IN_PROGRESS]: {
    label: 'In motion',
    description: 'Quotes and meetings on the go.',
  },
  [VendorFilter.BOOKED]: {
    label: 'Booked',
    description: 'Signed and locked in.',
  },
  [VendorFilter.PASSED]: {
    label: 'Closed',
    description: 'Passed or declined - kept for the record.',
  },
};

/** Statuses that count as "still need a decision". */
export const ATTENTION_STATUSES = [VendorStatus.SAVED, VendorStatus.CONTACTED];

/** Statuses that count as active pipeline. */
export const IN_PROGRESS_STATUSES = [VendorStatus.QUOTED, VendorStatus.MEETING_SCHEDULED];

/** Statuses that are done (won or lost). */
export const CLOSED_STATUSES = [VendorStatus.BOOKED, VendorStatus.DECLINED, VendorStatus.PASSED];

export const VENDOR_SORT = {
  UPDATED: 'updated',
  NAME: 'name',
  STATUS: 'status',
  AMOUNT: 'amount',
  CATEGORY: 'category',
};

export const VENDOR_SORT_OPTIONS = [
  { value: VENDOR_SORT.UPDATED, label: 'Recently updated' },
  { value: VENDOR_SORT.NAME, label: 'Name' },
  { value: VENDOR_SORT.STATUS, label: 'Status' },
  { value: VENDOR_SORT.AMOUNT, label: 'Quoted amount' },
  { value: VENDOR_SORT.CATEGORY, label: 'Category' },
];

export const VENDOR_COPY = {
  screenEyebrow: 'Planning',
  screenTitle: 'Vendors',
  heroEmptyTitle: 'No vendors yet',
  heroEmptyBody:
    'Save a venue, photographer or caterer here. Track quotes, meetings, what you have booked and what you still owe.',
  addLabel: 'Add vendor',
  compareLabel: 'Compare vendors',
  saveLabel: 'Save vendor',
  deleteLabel: 'Remove vendor',
  deleteConfirmTitle: 'Remove this vendor?',
  deleteConfirmMessage:
    'Their details, quote and payments will leave this list. Any budget expense you created stays.',
  deleteSuccess: 'Vendor removed',
  saveSuccess: 'Vendor saved',
  markBookedSuccess: 'Marked as booked',
  filterEyebrow: 'Show',
  timelineEyebrow: 'When to book',
  timelineTitle: 'Booking windows',
  timelineSubtitle: 'Based on your wedding date and typical lead times.',
  categoriesEyebrow: 'By type',
  categoriesTitle: 'Categories',
  listEyebrow: 'Your list',
  listTitle: 'Tracked vendors',
  emptyFilteredTitle: 'Nothing in this view',
  emptyFilteredBody: 'Try another filter, or add a vendor to get started.',
  detailEyebrow: 'Vendor',
  notesEyebrow: 'Remember',
  notesTitle: 'Notes',
  paymentsEyebrow: 'Money',
  paymentsTitle: 'Payment plan',
  paymentsEmpty: 'Add a quoted amount and a deposit to plan the payments.',
  paymentsHint: 'Tap a payment to mark it paid.',
  upcomingTitle: 'Coming up to pay',
  budgetLabel: 'Add to budget',
  budgetLinked: 'In your budget',
  budgetConfirmTitle: 'Add to your budget?',
  budgetSuccess: 'Added to your budget',
  contactEyebrow: 'Reach them',
  quickActionsTitle: 'Next steps',
  formEyebrowAdd: 'New vendor',
  formEyebrowEdit: 'Edit vendor',
  formTitleAdd: 'Add a vendor',
  formTitleEdit: 'Update vendor',
  notFoundTitle: 'Vendor not found',
  notFoundBody: 'It may have been removed from your list.',
  backToList: 'Back to vendors',
};

export const VENDOR_PLACEHOLDERS = {
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

/**
 * The form's fields. Deposit and balance are form-only: they are turned into
 * the vendor's `payments` list on save (see `paymentsFromMilestones`).
 */
export const EMPTY_VENDOR_VALUES = {
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
};

export const VENDOR_TIPS = [
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

const OPEN_STATUSES = [
  VendorStatus.SAVED,
  VendorStatus.CONTACTED,
  VendorStatus.QUOTED,
  VendorStatus.MEETING_SCHEDULED,
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
    from: OPEN_STATUSES,
  },
  {
    id: 'pass',
    label: 'We passed',
    status: VendorStatus.PASSED,
    icon: 'close',
    from: OPEN_STATUSES,
  },
];

export { VendorStatus, VENDOR_STATUS_META, VENDOR_CATEGORIES };
