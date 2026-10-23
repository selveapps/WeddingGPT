export const TRANSPORT_STATUSES = ['planned', 'requested', 'confirmed'];

export function validateTransport(values) {
  const errors = {};
  if (!String(values.route ?? '').trim()) errors.route = 'Add the route or journey.';
  if (!String(values.pickup ?? '').trim()) errors.pickup = 'Add a pickup point.';
  if (!String(values.provider ?? '').trim()) errors.provider = 'Add a transport provider.';
  if (values.time && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(values.time)) errors.time = 'Use 24-hour HH:MM.';
  if (values.capacity === '' || !Number.isInteger(Number(values.capacity)) || Number(values.capacity) < 1) {
    errors.capacity = 'Capacity must be a whole number greater than zero.';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function normalizeTransport(values) {
  return {
    route: String(values.route ?? '').trim(),
    pickup: String(values.pickup ?? '').trim(),
    time: String(values.time ?? '').trim(),
    provider: String(values.provider ?? '').trim(),
    contact: String(values.contact ?? '').trim(),
    capacity: Number(values.capacity),
    status: TRANSPORT_STATUSES.includes(values.status) ? values.status : 'planned',
  };
}

export function searchTransport(records, query) {
  const term = String(query ?? '')
    .trim()
    .toLocaleLowerCase();
  return term
    ? records.filter((record) =>
        [record.route, record.pickup, record.provider, record.contact].some((value) =>
          String(value ?? '')
            .toLocaleLowerCase()
            .includes(term)
        )
      )
    : records;
}

export function sortTransport(records) {
  return [...records].sort(
    (a, b) => (a.time || '99:99').localeCompare(b.time || '99:99') || a.route.localeCompare(b.route)
  );
}

export function summarizeTransport(records) {
  return {
    routes: records.length,
    confirmed: records.filter((record) => record.status === 'confirmed').length,
    seats: records.reduce((total, record) => total + (Number(record.capacity) || 0), 0),
  };
}
