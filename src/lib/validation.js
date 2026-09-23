/**
 * Form validation primitives.
 *
 * Rules are plain functions returning `null` (valid) or a human message. They
 * compose through `validate()`, and `validateForm()` runs a whole schema at
 * once. Messages are written in the product's voice - warm and specific, never
 * "Invalid input".
 */

export const rules = {
  required: (label = 'This') => (value) => {
    if (value === null || value === undefined) return `${label} is required.`;
    if (typeof value === 'string' && value.trim() === '') return `${label} is required.`;
    if (Array.isArray(value) && value.length === 0) return `Pick at least one option.`;
    return null;
  },

  minLength: (min, label = 'This') => (value) => {
    if (value == null || value === '') return null; // `required` owns emptiness
    return String(value).trim().length < min
      ? `${label} needs at least ${min} character${min === 1 ? '' : 's'}.`
      : null;
  },

  maxLength: (max, label = 'This') => (value) => {
    if (value == null) return null;
    return String(value).length > max ? `${label} is limited to ${max} characters.` : null;
  },

  email: () => (value) => {
    if (!value) return null;
    // Deliberately permissive - the only authority on a valid address is delivery.
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim())
      ? null
      : 'That email address looks incomplete.';
  },

  phone: () => (value) => {
    if (!value) return null;
    const digits = String(value).replace(/[^\d]/g, '');
    return digits.length >= 7 && digits.length <= 15
      ? null
      : 'That phone number looks incomplete.';
  },

  isoDate: () => (value) => {
    if (!value) return null;
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? null : 'Pick a valid date.';
  },

  /** Rejects dates in the past - used for due dates and wedding dates. */
  notPast: (label = 'That date') => (value) => {
    if (!value) return null;
    const today = new Date();
    const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return String(value) < todayISO ? `${label} is in the past.` : null;
  },

  min: (minimum, label = 'This') => (value) => {
    if (value == null || value === '') return null;
    return Number(value) < minimum ? `${label} must be at least ${minimum}.` : null;
  },

  max: (maximum, label = 'This') => (value) => {
    if (value == null || value === '') return null;
    return Number(value) > maximum ? `${label} must be ${maximum} or less.` : null;
  },

  positiveMoney: (label = 'Amount') => (value) => {
    if (value == null || value === '') return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return `${label} must be a number.`;
    return n < 0 ? `${label} cannot be negative.` : null;
  },
};

/** Run a list of rules against one value, returning the first failure. */
export function validate(value, ruleList = []) {
  for (const rule of ruleList) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
}

/**
 * Validate a whole form.
 * @param values  { fieldName: value }
 * @param schema  { fieldName: rule[] }
 * @returns { isValid, errors } where `errors` only contains failing fields.
 */
export function validateForm(values, schema) {
  const errors = {};
  for (const field of Object.keys(schema)) {
    const error = validate(values[field], schema[field]);
    if (error) errors[field] = error;
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}
