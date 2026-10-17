import { createEntity } from './base';
import { VendorStatus, TaskStatus } from './enums';

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
    bookedAt: null,
    lastContactedAt: null,
  });
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
