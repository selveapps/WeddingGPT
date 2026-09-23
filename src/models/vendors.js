import { createEntity } from './base';
import { VendorStatus } from './enums';

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
