/**
 * Honeymoon planning model — destinations, itinerary days, bookings, budget,
 * packing, and weather notes. Designed for local-first persistence.
 */

export const HONEYMOON_STORAGE_KEY = 'tools:honeymoon:v2';

export const BookingType = Object.freeze({
  FLIGHT: 'flight',
  HOTEL: 'hotel',
  TRAIN: 'train',
  CAR: 'car',
  ACTIVITY: 'activity',
  RESTAURANT: 'restaurant',
  INSURANCE: 'insurance',
  OTHER: 'other',
});

export const BOOKING_TYPE_META = Object.freeze({
  [BookingType.FLIGHT]: { label: 'Flight', icon: 'plane' },
  [BookingType.HOTEL]: { label: 'Hotel', icon: 'bed' },
  [BookingType.TRAIN]: { label: 'Train', icon: 'train' },
  [BookingType.CAR]: { label: 'Car / transfer', icon: 'car' },
  [BookingType.ACTIVITY]: { label: 'Activity', icon: 'compass' },
  [BookingType.RESTAURANT]: { label: 'Restaurant', icon: 'utensils' },
  [BookingType.INSURANCE]: { label: 'Insurance', icon: 'shield' },
  [BookingType.OTHER]: { label: 'Other', icon: 'more' },
});

export const ExpenseCategory = Object.freeze({
  TRAVEL: 'Travel',
  STAY: 'Stay',
  FOOD: 'Food',
  ACTIVITIES: 'Activities',
  SHOPPING: 'Shopping',
  TIPS: 'Tips',
  MISC: 'Misc',
});

export const EXPENSE_CATEGORIES = Object.values(ExpenseCategory);

export const PackingCategory = Object.freeze({
  DOCUMENTS: 'Documents',
  CLOTHES: 'Clothes',
  TOILETRIES: 'Toiletries',
  ELECTRONICS: 'Electronics',
  HEALTH: 'Health',
  MISC: 'Misc',
});

export const DEFAULT_PACKING = [
  { id: 'p-passport', title: 'Passports / IDs', category: PackingCategory.DOCUMENTS, done: false },
  { id: 'p-tickets', title: 'Tickets & boarding passes', category: PackingCategory.DOCUMENTS, done: false },
  { id: 'p-insurance', title: 'Travel insurance docs', category: PackingCategory.DOCUMENTS, done: false },
  { id: 'p-outfits', title: 'Daily outfits', category: PackingCategory.CLOTHES, done: false },
  { id: 'p-swim', title: 'Swimwear', category: PackingCategory.CLOTHES, done: false },
  { id: 'p-charger', title: 'Phone chargers', category: PackingCategory.ELECTRONICS, done: false },
  { id: 'p-meds', title: 'Medications', category: PackingCategory.HEALTH, done: false },
  { id: 'p-sunscreen', title: 'Sunscreen', category: PackingCategory.TOILETRIES, done: false },
];

export function createId(prefix = 'hm') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyHoneymoonState() {
  return {
    version: 2,
    details: {
      destination: '',
      country: '',
      departure: '',
      returnDate: '',
      budget: '',
      currency: 'INR',
      travelers: 2,
      notes: '',
      vibe: '',
    },
    itinerary: [],
    bookings: [],
    expenses: [],
    packing: DEFAULT_PACKING.map((p) => ({ ...p })),
    ideas: [],
    updatedAt: null,
  };
}

export function normaliseHoneymoonState(raw) {
  const base = emptyHoneymoonState();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    details: { ...base.details, ...(raw.details || {}) },
    itinerary: Array.isArray(raw.itinerary) ? raw.itinerary : [],
    bookings: Array.isArray(raw.bookings) ? raw.bookings : [],
    expenses: Array.isArray(raw.expenses) ? raw.expenses : [],
    packing: Array.isArray(raw.packing) && raw.packing.length ? raw.packing : base.packing,
    ideas: Array.isArray(raw.ideas) ? raw.ideas : [],
  };
}

export function parseAmount(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value);
  const n = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function tripDayCount(departure, returnDate) {
  if (!departure || !returnDate) return 0;
  const a = new Date(departure);
  const b = new Date(returnDate);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  const ms = b.getTime() - a.getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
}

export function budgetSummary(state) {
  const budget = parseAmount(state.details?.budget);
  const spent = (state.expenses || []).reduce((sum, e) => sum + parseAmount(e.amount), 0);
  const booked = (state.bookings || []).reduce((sum, b) => sum + parseAmount(b.cost), 0);
  const totalCommitted = spent + booked;
  return {
    budget,
    spent,
    booked,
    totalCommitted,
    remaining: budget - totalCommitted,
    overBudget: budget > 0 && totalCommitted > budget,
    percentUsed: budget > 0 ? Math.min(999, Math.round((totalCommitted / budget) * 100)) : 0,
  };
}

export function expensesByCategory(expenses = []) {
  const map = {};
  for (const e of expenses) {
    const cat = e.category || ExpenseCategory.MISC;
    map[cat] = (map[cat] || 0) + parseAmount(e.amount);
  }
  return map;
}

export function packingProgress(packing = []) {
  const total = packing.length;
  const done = packing.filter((p) => p.done).length;
  return {
    total,
    done,
    remaining: total - done,
    percent: total ? Math.round((done / total) * 100) : 0,
  };
}

export function createItineraryDay(dayNumber, date = '', title = '') {
  return {
    id: createId('day'),
    dayNumber,
    date,
    title: title || `Day ${dayNumber}`,
    morning: '',
    afternoon: '',
    evening: '',
    notes: '',
    places: [],
  };
}

export function createBooking(partial = {}) {
  return {
    id: createId('book'),
    type: BookingType.OTHER,
    title: '',
    confirmation: '',
    startDate: '',
    endDate: '',
    cost: '',
    currency: 'INR',
    provider: '',
    notes: '',
    paid: false,
    ...partial,
  };
}

export function createExpense(partial = {}) {
  return {
    id: createId('exp'),
    title: '',
    amount: '',
    category: ExpenseCategory.MISC,
    date: '',
    notes: '',
    ...partial,
  };
}

export function createIdea(text) {
  return {
    id: createId('idea'),
    text: String(text || '').trim(),
    saved: true,
    createdAt: new Date().toISOString(),
  };
}

export function validateDetails(details) {
  const errors = {};
  if (details.departure && details.returnDate) {
    const a = new Date(details.departure);
    const b = new Date(details.returnDate);
    if (!Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime()) && b < a) {
      errors.returnDate = 'Return must be on or after departure';
    }
  }
  if (details.budget && parseAmount(details.budget) <= 0) {
    errors.budget = 'Budget should be a positive number';
  }
  return errors;
}

export function generateStarterItinerary(departure, returnDate) {
  const days = tripDayCount(departure, returnDate);
  if (days <= 0 || days > 30) return [];
  const list = [];
  const start = new Date(departure);
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    list.push(createItineraryDay(i + 1, iso, i === 0 ? 'Arrival' : i === days - 1 ? 'Departure' : `Day ${i + 1}`));
  }
  return list;
}

export function formatMoney(amount, currency = 'INR', locale = 'en-IN') {
  const n = parseAmount(amount);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
}

export function sortBookingsByDate(bookings = []) {
  return [...bookings].sort((a, b) => String(a.startDate || '').localeCompare(String(b.startDate || '')));
}

export function upcomingBookings(bookings = [], fromDate = new Date()) {
  const iso = fromDate.toISOString().slice(0, 10);
  return sortBookingsByDate(bookings).filter((b) => !b.startDate || b.startDate >= iso);
}

export function honeymoonCompleteness(state) {
  const weights = {
    destination: 2,
    dates: 2,
    budget: 1,
    itinerary: 2,
    bookings: 2,
    packing: 1,
  };
  let score = 0;
  let max = 0;
  max += weights.destination;
  if (state.details?.destination?.trim()) score += weights.destination;
  max += weights.dates;
  if (state.details?.departure && state.details?.returnDate) score += weights.dates;
  max += weights.budget;
  if (parseAmount(state.details?.budget) > 0) score += weights.budget;
  max += weights.itinerary;
  if ((state.itinerary || []).length > 0) score += weights.itinerary;
  max += weights.bookings;
  if ((state.bookings || []).length > 0) score += weights.bookings;
  max += weights.packing;
  const pack = packingProgress(state.packing);
  if (pack.percent >= 50) score += weights.packing;
  return { score, max, percent: max ? Math.round((score / max) * 100) : 0 };
}

export function exportHoneymoonSummary(state) {
  const summary = budgetSummary(state);
  const pack = packingProgress(state.packing);
  const complete = honeymoonCompleteness(state);
  return {
    exportedAt: new Date().toISOString(),
    destination: state.details?.destination || '',
    dates: {
      departure: state.details?.departure || '',
      returnDate: state.details?.returnDate || '',
      days: tripDayCount(state.details?.departure, state.details?.returnDate),
    },
    budget: summary,
    itineraryDays: (state.itinerary || []).length,
    bookings: (state.bookings || []).length,
    expenses: (state.expenses || []).length,
    packing: pack,
    completeness: complete,
  };
}

/** Seed ideas by vibe keyword (offline helper). */
export function ideaSuggestions(destination = '', vibe = '') {
  const d = String(destination).toLowerCase();
  const v = String(vibe).toLowerCase();
  const base = [
    'Sunrise walk on day 1',
    'One splurge dinner',
    'Half-day with no plans',
    'Local market morning',
    'Photo at golden hour',
  ];
  if (d.includes('bali') || d.includes('beach')) {
    base.push('Beach club afternoon', 'Temple visit at dusk', 'Scooter coastal drive');
  }
  if (d.includes('japan') || d.includes('tokyo') || d.includes('kyoto')) {
    base.push('Onsen evening', 'Kaiseki dinner', 'Garden stroll');
  }
  if (d.includes('kerala') || d.includes('goa') || d.includes('india')) {
    base.push('Houseboat / backwaters', 'Spice plantation', 'Sunset at the beach');
  }
  if (v.includes('adventure')) base.push('Guided hike', 'Water activity');
  if (v.includes('relax')) base.push('Spa morning', 'Late checkout day');
  return [...new Set(base)].slice(0, 12);
}

export default {
  HONEYMOON_STORAGE_KEY,
  emptyHoneymoonState,
  normaliseHoneymoonState,
  budgetSummary,
  packingProgress,
  createItineraryDay,
  createBooking,
  createExpense,
  generateStarterItinerary,
  honeymoonCompleteness,
  exportHoneymoonSummary,
};
