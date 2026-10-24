import { cleanText, makeId, toPositiveNumber } from './storage';

export const DEFAULT_VENDOR_CATEGORIES = [
  'Venue', 'Photography', 'Videography', 'Catering', 'Florist',
  'Makeup and hair', 'Music / DJ', 'Decor', 'Transport', 'Other',
];

export function normalizeVendor(vendor = {}) {
  return {
    id: cleanText(vendor.id, 100) || makeId('vendor'),
    name: cleanText(vendor.name, 100) || 'Unnamed vendor',
    category: cleanText(vendor.category, 80) || 'Other',
    quote: toPositiveNumber(vendor.quote, 0),
    deposit: toPositiveNumber(vendor.deposit, 0),
    rating: Math.max(0, Math.min(5, toPositiveNumber(vendor.rating, 0))),
    available: vendor.available !== false,
    includes: cleanText(vendor.includes, 400),
    excludes: cleanText(vendor.excludes, 400),
    contact: cleanText(vendor.contact, 160),
    notes: cleanText(vendor.notes, 500),
    updatedAt: vendor.updatedAt || new Date().toISOString(),
  };
}

export function validateVendorDraft(draft = {}) {
  const errors = {};
  if (!cleanText(draft.name, 100)) errors.name = 'Enter a vendor name.';
  if (!cleanText(draft.category, 80)) errors.category = 'Choose a category.';
  const quote = Number(draft.quote);
  if (!Number.isFinite(quote) || quote < 0) errors.quote = 'Quote must be zero or greater.';
  const deposit = Number(draft.deposit || 0);
  if (!Number.isFinite(deposit) || deposit < 0) errors.deposit = 'Deposit must be zero or greater.';
  if (Number(draft.rating) < 0 || Number(draft.rating) > 5) errors.rating = 'Rating must be between 0 and 5.';
  return errors;
}

export function addVendor(vendors, draft) {
  return [...vendors, normalizeVendor({ ...draft, id: makeId('vendor') })];
}

export function updateVendor(vendors, id, patch) {
  return vendors.map((vendor) => vendor.id === id
    ? normalizeVendor({ ...vendor, ...patch, id, updatedAt: new Date().toISOString() })
    : vendor);
}

export function deleteVendor(vendors, id) {
  return vendors.filter((vendor) => vendor.id !== id);
}

export function remainingVendorBalance(vendor) {
  return Math.max(0, vendor.quote - vendor.deposit);
}

export function getVendorComparison(vendors, weights = {}) {
  const priceWeight = Math.max(0, Number(weights.price ?? 0.45));
  const ratingWeight = Math.max(0, Number(weights.rating ?? 0.35));
  const availabilityWeight = Math.max(0, Number(weights.availability ?? 0.2));
  const weightTotal = priceWeight + ratingWeight + availabilityWeight || 1;
  const normalizedWeights = {
    price: priceWeight / weightTotal,
    rating: ratingWeight / weightTotal,
    availability: availabilityWeight / weightTotal,
  };
  const available = vendors.filter((vendor) => vendor.available);
  const maxQuote = Math.max(1, ...available.map((vendor) => vendor.quote));
  return vendors.map((raw) => {
    const vendor = normalizeVendor(raw);
    const priceScore = vendor.available ? 1 - vendor.quote / maxQuote : 0;
    const ratingScore = vendor.rating / 5;
    const availabilityScore = vendor.available ? 1 : 0;
    const score = (priceScore * normalizedWeights.price
      + ratingScore * normalizedWeights.rating
      + availabilityScore * normalizedWeights.availability) * 100;
    return {
      ...vendor,
      balance: remainingVendorBalance(vendor),
      score: Math.round(score * 10) / 10,
      priceScore: Math.round(priceScore * 100),
      ratingScore: Math.round(ratingScore * 100),
      availabilityScore: Math.round(availabilityScore * 100),
    };
  }).sort((a, b) => b.score - a.score);
}

export function summarizeVendorCosts(vendors = []) {
  const list = vendors.map(normalizeVendor);
  const available = list.filter((vendor) => vendor.available);
  return {
    count: list.length,
    availableCount: available.length,
    totalQuotes: list.reduce((sum, vendor) => sum + vendor.quote, 0),
    availableQuotes: available.reduce((sum, vendor) => sum + vendor.quote, 0),
    depositsPaid: list.reduce((sum, vendor) => sum + vendor.deposit, 0),
    outstanding: list.reduce((sum, vendor) => sum + remainingVendorBalance(vendor), 0),
    averageRating: list.length ? list.reduce((sum, vendor) => sum + vendor.rating, 0) / list.length : 0,
  };
}

export function filterVendors(vendors, { query = '', category = 'All', availableOnly = false } = {}) {
  const normalizedQuery = cleanText(query, 100).toLowerCase();
  return vendors.map(normalizeVendor).filter((vendor) => {
    const matchesQuery = !normalizedQuery
      || [vendor.name, vendor.category, vendor.includes, vendor.notes]
        .some((field) => field.toLowerCase().includes(normalizedQuery));
    const matchesCategory = category === 'All' || vendor.category === category;
    const matchesAvailability = !availableOnly || vendor.available;
    return matchesQuery && matchesCategory && matchesAvailability;
  });
}

export function exportVendorComparison(vendors, currency = 'INR') {
  const ranked = getVendorComparison(vendors);
  const money = (value) => `${currency} ${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const rows = [
    'Vendor comparison',
    '',
    'Rank | Vendor | Category | Quote | Deposit | Balance | Rating | Available | Score',
    ...ranked.map((vendor, index) => [
      index + 1, vendor.name, vendor.category, money(vendor.quote), money(vendor.deposit),
      money(vendor.balance), `${vendor.rating}/5`, vendor.available ? 'Yes' : 'No', vendor.score,
    ].join(' | ')),
  ];
  return rows.join('\n');
}
