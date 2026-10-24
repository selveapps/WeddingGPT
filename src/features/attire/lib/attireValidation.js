/**
 * Validation for attire forms.
 */
export function validateAttireItem(values = {}) {
  const errors = {};
  if (!String(values.title || '').trim() && !String(values.wearerName || '').trim()) {
    errors.title = 'Add a title or wearer name';
  }
  if (values.cost != null && values.cost !== '' && Number(values.cost) < 0) {
    errors.cost = 'Cost cannot be negative';
  }
  if (values.rental && values.rentalReturnDate) {
    const d = new Date(values.rentalReturnDate);
    if (Number.isNaN(d.getTime())) errors.rentalReturnDate = 'Invalid return date';
  }
  if (values.colorHex && !/^#?[0-9A-Fa-f]{6}$/.test(String(values.colorHex).replace('#', '').length === 6 ? values.colorHex : '')) {
    // soft check
    if (values.colorHex && !String(values.colorHex).startsWith('#')) {
      // allow without hash
    }
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateFitting(values = {}) {
  const errors = {};
  if (!values.attireItemId) errors.attireItemId = 'Select an outfit';
  if (values.status === 'scheduled' && !values.scheduledAt) {
    errors.scheduledAt = 'Pick a date and time';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateAccessory(values = {}) {
  const errors = {};
  if (!String(values.name || '').trim()) errors.name = 'Name is required';
  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateSwatch(values = {}) {
  const errors = {};
  if (!String(values.hex || '').trim()) errors.hex = 'Hex color required';
  else {
    const h = String(values.hex).replace('#', '');
    if (!/^[0-9A-Fa-f]{6}$/.test(h)) errors.hex = 'Use 6-digit hex';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export function normalizeHex(hex) {
  if (!hex) return null;
  const h = String(hex).trim().replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(h)) return null;
  return `#${h.toUpperCase()}`;
}
