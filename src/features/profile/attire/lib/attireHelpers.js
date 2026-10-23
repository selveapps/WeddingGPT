export const ATTIRE_STATUSES = ['planned', 'fitting', 'ready', 'picked-up'];

function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateAttire(values) {
  const errors = {};
  if (!String(values.person ?? '').trim()) errors.person = 'Add the person wearing this item.';
  if (!String(values.garment ?? '').trim()) errors.garment = 'Add a garment or accessory.';
  for (const key of ['fittingDate', 'pickupDate']) {
    if (values[key] && !isDate(values[key])) {
      errors[key] = 'Use YYYY-MM-DD.';
    }
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function normalizeAttire(values) {
  return {
    person: String(values.person ?? '').trim(),
    garment: String(values.garment ?? '').trim(),
    fittingDate: String(values.fittingDate ?? '').trim(),
    pickupDate: String(values.pickupDate ?? '').trim(),
    status: ATTIRE_STATUSES.includes(values.status) ? values.status : 'planned',
    notes: String(values.notes ?? '').trim(),
  };
}

export function searchAttire(records, query) {
  const term = String(query ?? '')
    .trim()
    .toLocaleLowerCase();
  if (!term) return records;
  return records.filter((item) =>
    [item.person, item.garment, item.notes].some((value) =>
      String(value ?? '')
        .toLocaleLowerCase()
        .includes(term)
    )
  );
}

export function sortAttire(records) {
  return [...records].sort((a, b) =>
    (a.fittingDate || a.pickupDate || '9999').localeCompare(b.fittingDate || b.pickupDate || '9999')
  );
}

export function summarizeAttire(records) {
  return {
    total: records.length,
    ready: records.filter((item) => item.status === 'ready' || item.status === 'picked-up').length,
    upcoming: records.filter((item) => item.status !== 'picked-up').length,
  };
}
