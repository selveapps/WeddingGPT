import { VendorStatus } from './enums';
import { PARTY_ROLES } from './weddingParty';
import { itemEnd, sortRunOfShow } from './runOfShow';

/**
 * Live mode for the run of show (slice I1): on the day itself, what is on
 * now, what is next and in how long, and who to call about it. Pure, so the
 * screen only passes in the clock.
 *
 * Owners are free text ("Caterer", "DJ", "Priya"), so `findContact` matches
 * them to a vendor or a wedding party member with a phone number: by name
 * first, then by what they do.
 */

/** The date a run of show happens on: its event's, or the wedding's. */
export function dayDate({ event = null, wedding = null } = {}) {
  return (event ? event.date : wedding?.date) ?? null;
}

/** Minutes after midnight of a Date, the run of show's unit. */
export const minutesOfDay = (date) => date.getHours() * 60 + date.getMinutes();

/**
 * Where the day is at `now` (minutes after midnight). An item is on from its
 * start until its end; one with no duration is on for its starting minute.
 * Returns `{ current, next, startsIn, done, total, finished }`.
 */
export function liveDay(items = [], now) {
  const sorted = sortRunOfShow(items);
  const isOn = (item) => item.start <= now && now < Math.max(itemEnd(item), item.start + 1);
  const current = sorted.filter(isOn);
  const next = sorted.find((item) => item.start > now) ?? null;
  const done = sorted.filter((item) => !isOn(item) && item.start <= now).length;
  return {
    current,
    next,
    startsIn: next ? next.start - now : null,
    done,
    total: sorted.length,
    finished: sorted.length > 0 && !current.length && !next,
  };
}

/** What a vendor in each category gets called in a run of show. */
const CATEGORY_WORDS = {
  venue: ['venue', 'hall', 'banquet'],
  catering: ['caterer', 'catering', 'chef', 'kitchen', 'food', 'bar', 'bartender'],
  photography: ['photographer', 'photography', 'photo', 'photos'],
  videography: ['videographer', 'videography', 'video', 'film'],
  music: ['dj', 'band', 'music', 'musician', 'musicians', 'dhol', 'singer'],
  florals: ['florist', 'flowers', 'florals', 'decor', 'decorator'],
  beauty: ['hair', 'makeup', 'mua', 'beauty', 'stylist'],
  cake: ['cake', 'baker', 'bakery', 'desserts'],
  transport: ['transport', 'driver', 'car', 'cars', 'bus', 'shuttle'],
  planner: ['planner', 'coordinator'],
  officiant: ['officiant', 'celebrant', 'priest', 'pandit', 'minister', 'rabbi', 'imam'],
  rentals: ['rentals', 'rental'],
};

/** Plurals and loose names people use for party roles. */
const ROLE_WORDS = {
  maid_of_honor: ['maid of honor', 'matron of honor', 'maid of honour'],
  best_man: ['best man'],
  bridesmaid: ['bridesmaid', 'bridesmaids'],
  groomsman: ['groomsman', 'groomsmen'],
  usher: ['usher', 'ushers'],
  reader: ['reader', 'readers'],
  parent: ['parent', 'parents'],
};

const words = (text) => (text ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];
const hasPhone = (person) => Boolean(person?.phone?.trim());
const contains = (owner, name) => {
  const needle = words(name).join(' ');
  return needle.length > 1 && ` ${words(owner).join(' ')} `.includes(` ${needle} `);
};

/** A `tel:` link for a typed number, or null if it has no digits. */
export function phoneUrl(phone) {
  const digits = (phone ?? '').replace(/[^\d+]/g, '');
  return /\d/.test(digits) ? `tel:${digits}` : null;
}

/**
 * The person to call about an item run by `owner`: `{ name, phone, kind }`
 * with kind 'vendor' or 'party', or null. Someone named in the owner wins;
 * then a vendor in the category the owner describes, booked ones first; then
 * a party member in the role it describes.
 */
export function findContact(owner, { vendors = [], party = [] } = {}) {
  if (!owner?.trim()) return null;
  const asVendor = (vendor) => ({ name: vendor.name, phone: vendor.phone.trim(), kind: 'vendor' });
  const asMember = (member) => ({ name: member.name, phone: member.phone.trim(), kind: 'party' });
  const callable = vendors.filter(
    (vendor) =>
      hasPhone(vendor) && vendor.status !== VendorStatus.DECLINED && vendor.status !== VendorStatus.PASSED
  );
  const members = party.filter(hasPhone);

  const namedVendor = callable.find(
    (vendor) => contains(owner, vendor.name) || contains(owner, vendor.contactName)
  );
  if (namedVendor) return asVendor(namedVendor);
  const namedMember = members.find((member) => contains(owner, member.name));
  if (namedMember) return asMember(namedMember);

  const ownerWords = new Set(words(owner));
  const category = Object.keys(CATEGORY_WORDS).find((key) =>
    CATEGORY_WORDS[key].some((word) => ownerWords.has(word))
  );
  if (category) {
    const inCategory = callable.filter((vendor) => vendor.categoryKey === category);
    const vendor = inCategory.find((v) => v.status === VendorStatus.BOOKED) ?? inCategory[0];
    if (vendor) return asVendor(vendor);
  }

  const role = PARTY_ROLES.find(({ key, label }) =>
    [label, ...(ROLE_WORDS[key] ?? [])].some((name) => contains(owner, name))
  );
  const member = role && members.find((m) => m.roleKey === role.key);
  return member ? asMember(member) : null;
}

/**
 * Everyone to call on the day: one row per contact found for the items'
 * owners, in run-of-show order, with the items they run.
 */
export function dayContacts(items = [], people = {}) {
  const rows = new Map();
  for (const item of sortRunOfShow(items)) {
    const contact = findContact(item.owner, people);
    if (!contact) continue;
    const key = `${contact.kind}:${contact.name}:${contact.phone}`;
    if (!rows.has(key)) rows.set(key, { ...contact, key, items: [] });
    rows.get(key).items.push(item.title);
  }
  return [...rows.values()];
}
