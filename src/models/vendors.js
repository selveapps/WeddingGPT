import { createEntity } from './base';
import { VendorStatus, TaskStatus, PaymentStatus, ExpenseCommitment } from './enums';
import { daysUntil } from '../lib/date';

/**
 * Vendors, their categories, quotes and notes.
 *
 * Vendor *discovery* in this build is a curated local catalogue rather than a
 * live marketplace - there is no directory to query yet. The model is shaped so
 * a saved vendor and a catalogue vendor are the same thing with a different
 * `source`, which means wiring a real directory later is a service swap, not a
 * data migration.
 */

export const VENDOR_CATEGORIES = [
  { key: 'venue', name: 'Venues', icon: 'location' },
  { key: 'catering', name: 'Catering', icon: 'vendors' },
  { key: 'photography', name: 'Photography', icon: 'camera' },
  { key: 'videography', name: 'Videography', icon: 'camera' },
  { key: 'music', name: 'Music and DJs', icon: 'sparkle' },
  { key: 'florals', name: 'Florals and decor', icon: 'vision' },
  { key: 'attire', name: 'Attire', icon: 'star' },
  { key: 'beauty', name: 'Hair and makeup', icon: 'star' },
  { key: 'cake', name: 'Cake and desserts', icon: 'vendors' },
  { key: 'stationery', name: 'Stationery', icon: 'mail' },
  { key: 'transport', name: 'Transport', icon: 'location' },
  { key: 'planner', name: 'Planners', icon: 'checklist' },
  { key: 'officiant', name: 'Officiants', icon: 'rings' },
  { key: 'rentals', name: 'Rentals', icon: 'vendors' },
];

/**
 * What to search a map for, per vendor category, when a couple asks for local
 * recommendations. Phrased the way people actually search ("wedding
 * photographers"), because that is what map search ranks well on.
 */
const LOCAL_SEARCH_TERMS = {
  venue: 'wedding venues',
  catering: 'wedding caterers',
  photography: 'wedding photographers',
  videography: 'wedding videographers',
  music: 'wedding DJs and bands',
  florals: 'wedding florists',
  attire: 'bridal shops',
  beauty: 'bridal hair and makeup',
  cake: 'wedding cakes',
  stationery: 'wedding invitations printing',
  transport: 'wedding transportation',
  planner: 'wedding planners',
  officiant: 'wedding officiants',
  rentals: 'wedding rentals',
};

/** "wedding photographers near Austin, TX" - or null without a city. */
export function localSearchQuery(categoryKey, city) {
  const place = city?.trim();
  if (!place) return null;
  return `${LOCAL_SEARCH_TERMS[categoryKey] ?? 'wedding vendors'} near ${place}`;
}

/**
 * How many months ahead couples typically book each kind of vendor. Rough,
 * widely-quoted planning lead times - enough to say "book this now" versus
 * "this can wait", not a promise about any one market.
 */
const BOOKING_LEAD_MONTHS = {
  venue: 12,
  planner: 12,
  photography: 10,
  catering: 9,
  videography: 9,
  attire: 9,
  music: 8,
  florals: 6,
  officiant: 5,
  stationery: 5,
  beauty: 4,
  cake: 3,
  transport: 3,
  rentals: 3,
};

/** Plan tasks whose completion means that category is already booked. */
const BOOKED_TASK_PATTERNS = {
  venue: /book the (ceremony|reception) venue/i,
  photography: /book your photographer/i,
  catering: /book catering/i,
  music: /book music/i,
  florals: /book flowers/i,
  beauty: /book hair and makeup/i,
  transport: /book transport/i,
  attire: /order your outfits/i,
};

const URGENCY_COPY = {
  now: 'Book now',
  soon: 'Start looking',
  later: 'Later',
  booked: 'Booked',
};

/**
 * Local picks, ranked for this wedding.
 *
 * Every vendor category, ordered by how pressing it is given the wedding date:
 * anything whose usual booking window has opened comes first, then what opens
 * in the next few months, then the rest, and finally what the plan says is
 * already booked. Without a date, the long-lead categories lead.
 *
 * `tasks` are the plan tasks; a completed "Book your photographer" task marks
 * photography as booked.
 */
export function recommendLocalPicks({ weddingDate = null, tasks = [], from = new Date() } = {}) {
  const monthsLeft = weddingDate
    ? (new Date(`${weddingDate}T12:00:00`).getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    : null;

  const doneTitles = tasks.filter((t) => t.status === TaskStatus.DONE).map((t) => t.title ?? '');

  return VENDOR_CATEGORIES.map((category, order) => {
    const lead = BOOKING_LEAD_MONTHS[category.key] ?? 4;
    const pattern = BOOKED_TASK_PATTERNS[category.key];
    const booked = pattern ? doneTitles.some((title) => pattern.test(title)) : false;

    let urgency;
    if (booked) urgency = 'booked';
    else if (monthsLeft === null) urgency = lead >= 9 ? 'now' : lead >= 5 ? 'soon' : 'later';
    else if (monthsLeft <= lead) urgency = 'now';
    else if (monthsLeft <= lead + 3) urgency = 'soon';
    else urgency = 'later';

    const reason = booked
      ? 'Already booked in your plan'
      : urgency === 'now'
        ? `Usually booked ${lead}+ months ahead`
        : `Most couples book about ${lead} months out`;

    return { ...category, lead, urgency, urgencyLabel: URGENCY_COPY[urgency], reason, order };
  }).sort((a, b) => {
    const rank = { now: 0, soon: 1, later: 2, booked: 3 };
    return rank[a.urgency] - rank[b.urgency] || b.lead - a.lead || a.order - b.order;
  });
}

export const VendorSource = {
  CATALOGUE: 'catalogue',
  MANUAL: 'manual',
};

export function createVendorCategory({ key, name, icon = 'vendors', order = 0 } = {}) {
  return createEntity('vcat', { key, name, icon, order });
}

export function createVendor({
  weddingId,
  categoryKey,
  name,
  contactName = '',
  email = null,
  phone = null,
  website = null,
  city = '',
  status = VendorStatus.SAVED,
  source = VendorSource.MANUAL,
  priceHint = null,
  rating = null,
  notes = '',
  quotedAmount = null,
  quoteScope = '',
  quoteValidUntil = null,
  meetingAt = null,
  payments = [],
  meetings = [],
  followUpAt = null,
  followUpNote = '',
  appointments = [],
  expenseId = null,
  bookedAt = null,
  lastContactedAt = null,
} = {}) {
  return createEntity('vendor', {
    weddingId,
    categoryKey,
    name,
    contactName,
    email,
    phone,
    website,
    city,
    status,
    source,
    /** Rough price band for browsing, distinct from a real quote. */
    priceHint,
    rating,
    notes,
    /** The quoted or contracted price, in minor units. Payments are split from it. */
    quotedAmount,
    /** What the quote actually covers - vital when comparing two vendors. */
    quoteScope,
    quoteValidUntil,
    /** Before slice H1, the one meeting date; read through `vendorAppointments`. */
    meetingAt,
    /** `[{ id, label, amount, dueDate, paidAt }]` - see `paymentsFromMilestones`. */
    payments,
    meetings,
    followUpAt,
    followUpNote,
    /** `[{ id, kind, date, time, place, notes, outcome }]` - see `models/appointments`. */
    appointments,
    /** The budget expense created from this vendor, once there is one. */
    expenseId,
    bookedAt,
    lastContactedAt,
  });
}

// --- Payments ------------------------------------------------------------------
//
// A vendor's price is split into a deposit and a final balance. They are kept
// as a list of payments with stable ids, so marking one paid survives editing
// the amounts, and a third instalment can be added later without a migration.

export const PaymentId = {
  DEPOSIT: 'deposit',
  BALANCE: 'balance',
};

const PAYMENT_LABELS = {
  [PaymentId.DEPOSIT]: 'Deposit',
  [PaymentId.BALANCE]: 'Final balance',
};

/**
 * Build the payment list from the form's deposit and balance fields.
 *
 * The balance defaults to whatever the deposit leaves of the quote. A payment
 * keeps its `paidAt` from `existing`, so editing a due date does not un-pay it.
 * Payments with neither an amount nor a date are left out.
 */
export function paymentsFromMilestones(
  {
    quotedAmount = null,
    depositAmount = null,
    depositDueAt = null,
    finalAmount = null,
    finalDueAt = null,
  } = {},
  existing = []
) {
  const paidAt = (id) => existing.find((payment) => payment.id === id)?.paidAt ?? null;
  const balance = finalAmount ?? (quotedAmount > 0 ? Math.max(0, quotedAmount - (depositAmount ?? 0)) : null);

  return [
    { id: PaymentId.DEPOSIT, amount: depositAmount, dueDate: depositDueAt },
    { id: PaymentId.BALANCE, amount: balance, dueDate: finalDueAt },
  ]
    .filter((payment) => payment.amount > 0 || payment.dueDate)
    .map((payment) => ({
      ...payment,
      label: PAYMENT_LABELS[payment.id],
      amount: payment.amount ?? 0,
      paidAt: paidAt(payment.id),
    }));
}

/** The form's deposit and balance fields, read back from a vendor's payments. */
export function milestonesFromPayments(vendor) {
  const find = (id) => (vendor?.payments ?? []).find((payment) => payment.id === id);
  const deposit = find(PaymentId.DEPOSIT);
  const balance = find(PaymentId.BALANCE);
  return {
    depositAmount: deposit?.amount || null,
    depositDueAt: deposit?.dueDate ?? null,
    finalAmount: balance?.amount || null,
    finalDueAt: balance?.dueDate ?? null,
  };
}

export function paymentTotals(vendor) {
  const payments = vendor?.payments ?? [];
  const scheduled = payments.reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
  const total = vendor?.quotedAmount ?? scheduled;
  const paid = payments.filter((payment) => payment.paidAt).reduce((sum, payment) => sum + payment.amount, 0);
  return { total, paid, outstanding: Math.max(0, total - paid) };
}

export function derivePaymentStatus(vendor) {
  const { total, paid } = paymentTotals(vendor);
  if (total > 0 && paid >= total) return PaymentStatus.PAID;
  if (paid === 0) return PaymentStatus.UNPAID;
  const onlyDeposit = (vendor.payments ?? []).every(
    (payment) => Boolean(payment.paidAt) === (payment.id === PaymentId.DEPOSIT)
  );
  return onlyDeposit ? PaymentStatus.DEPOSIT_PAID : PaymentStatus.PARTIALLY_PAID;
}

/** Unpaid payments for booked vendors, soonest first; undated ones last. */
export function upcomingVendorPayments(vendors = [], { from = new Date(), limit = 5 } = {}) {
  const rows = [];
  for (const vendor of vendors) {
    if (vendor.status !== VendorStatus.BOOKED) continue;
    for (const payment of vendor.payments ?? []) {
      if (payment.paidAt || !(payment.amount > 0)) continue;
      const days = payment.dueDate ? daysUntil(payment.dueDate, from) : null;
      rows.push({
        ...payment,
        key: `${vendor.id}:${payment.id}`,
        vendorId: vendor.id,
        vendorName: vendor.name,
        daysUntil: days,
        overdue: days !== null && days < 0,
      });
    }
  }

  rows.sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  return rows.slice(0, limit);
}

/**
 * The fields `useBudgetStore().addExpense` takes, for a vendor. Booked means
 * contractually owed, so it lands as committed; anything earlier is an estimate.
 */
export function vendorToExpenseDraft(vendor, weddingId) {
  const { total, paid } = paymentTotals(vendor);
  const nextDue = (vendor.payments ?? []).find((payment) => !payment.paidAt)?.dueDate ?? null;
  const category = VENDOR_CATEGORIES.find((item) => item.key === vendor.categoryKey);

  return {
    weddingId,
    vendorId: vendor.id,
    vendorName: vendor.name,
    title: category ? `${vendor.name} (${category.name})` : vendor.name,
    amount: total,
    paidAmount: paid,
    paymentStatus: derivePaymentStatus(vendor),
    commitment:
      vendor.status === VendorStatus.BOOKED ? ExpenseCommitment.COMMITTED : ExpenseCommitment.ESTIMATED,
    dueDate: nextDue,
  };
}

/**
 * Map a vendor saved by the Labs vendor manager (or the Labs quote reader) to
 * the fields `createVendor` takes. Labs used `contractTotal` and random payment
 * ids labelled "Deposit" and "Balance".
 */
export function vendorFieldsFromLab(lab, weddingId = null) {
  const payments = (lab?.payments ?? []).map((payment) => {
    const id = /deposit/i.test(payment.label ?? '')
      ? PaymentId.DEPOSIT
      : /balance/i.test(payment.label ?? '')
        ? PaymentId.BALANCE
        : payment.id;
    return {
      id,
      label: PAYMENT_LABELS[id] ?? payment.label ?? 'Payment',
      amount: payment.amount ?? 0,
      dueDate: payment.dueDate ?? null,
      paidAt: payment.paidAt ?? null,
    };
  });

  return {
    weddingId: lab?.weddingId ?? weddingId,
    categoryKey: lab?.categoryKey ?? null,
    name: lab?.name?.trim() || 'Vendor',
    status: Object.values(VendorStatus).includes(lab?.status) ? lab.status : VendorStatus.SAVED,
    quotedAmount: lab?.contractTotal > 0 ? lab.contractTotal : null,
    payments,
    expenseId: lab?.expenseId ?? null,
    bookedAt: lab?.bookedAt ?? null,
  };
}

export function createQuote({
  vendorId,
  weddingId,
  amount = 0,
  /** What the quote actually covers - vital when comparing two vendors. */
  scope = '',
  validUntil = null,
  isAccepted = false,
  notes = '',
} = {}) {
  return createEntity('quote', {
    vendorId,
    weddingId,
    amount,
    scope,
    validUntil,
    isAccepted,
    notes,
  });
}

export function createVendorNote({ vendorId, weddingId, body = '' } = {}) {
  return createEntity('vnote', { vendorId, weddingId, body });
}

export function isVendorBooked(vendor) {
  return vendor?.status === VendorStatus.BOOKED;
}

/** Category rollup for the vendor overview: how many saved, how many booked. */
export function summariseVendors(vendors = []) {
  const byCategory = {};
  let booked = 0;

  for (const vendor of vendors) {
    const key = vendor.categoryKey ?? 'other';
    if (!byCategory[key]) byCategory[key] = { saved: 0, booked: 0 };
    byCategory[key].saved++;
    if (isVendorBooked(vendor)) {
      byCategory[key].booked++;
      booked++;
    }
  }

  return { total: vendors.length, booked, byCategory };
}
