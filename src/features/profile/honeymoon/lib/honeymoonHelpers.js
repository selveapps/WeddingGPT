export const HONEYMOON_STATUSES = ['planned', 'booked', 'complete'];

function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateItineraryItem(values) {
  const errors = {};
  if (!String(values.item ?? '').trim()) errors.item = 'Name this itinerary item.';
  if (!String(values.destination ?? '').trim()) errors.destination = 'Add a destination.';
  if (values.date && !isDate(values.date)) errors.date = 'Use a real date in YYYY-MM-DD format.';
  if (values.time && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(values.time)) errors.time = 'Use 24-hour HH:MM.';
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function normalizeItineraryItem(values) {
  return {
    item: String(values.item ?? '').trim(),
    destination: String(values.destination ?? '').trim(),
    date: String(values.date ?? '').trim(),
    time: String(values.time ?? '').trim(),
    bookingReference: String(values.bookingReference ?? '').trim(),
    status: HONEYMOON_STATUSES.includes(values.status) ? values.status : 'planned',
    notes: String(values.notes ?? '').trim(),
  };
}

export function searchItinerary(records, query) {
  const term = String(query ?? '')
    .trim()
    .toLocaleLowerCase();
  return term
    ? records.filter((record) =>
        [record.item, record.destination, record.bookingReference, record.notes].some((value) =>
          String(value ?? '')
            .toLocaleLowerCase()
            .includes(term)
        )
      )
    : records;
}

export function sortItinerary(records) {
  return [...records].sort((a, b) =>
    `${a.date || '9999'}T${a.time || '99:99'}`.localeCompare(`${b.date || '9999'}T${b.time || '99:99'}`)
  );
}

export function summarizeItinerary(records) {
  return {
    total: records.length,
    booked: records.filter((record) => record.status === 'booked').length,
    datesSet: records.filter((record) => Boolean(record.date)).length,
  };
}
