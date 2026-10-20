/**
 * Validation schema for the Profile form.
 *
 * Only the fields that can be typed wrong are checked. Chip selections and
 * toggles cannot produce invalid values by construction, so they are omitted
 * rather than validated into a false sense of coverage.
 */

import { rules, validate, validateForm } from '@/lib/validation';
import { MAX_GUEST_COUNT, MAX_PROFILE_NOTE_LENGTH } from './profileConstants';

const nameRules = [rules.maxLength(60, 'A name')];
const requiredNameRules = [rules.required('Your name'), rules.maxLength(60, 'Your name')];

export const PROFILE_FIELD_RULES = {
  ownerName: requiredNameRules,
  email: [rules.email()],
  phone: [rules.phone()],
  partnerName: nameRules,
  partnerEmail: [rules.email()],
  city: [rules.maxLength(80, 'The city')],
  region: [rules.maxLength(80, 'The region')],
  country: [rules.maxLength(80, 'The country')],
  venueName: [rules.maxLength(120, 'The venue name')],
  guestCountEstimate: [
    rules.min(1, 'Guest count'),
    rules.max(MAX_GUEST_COUNT, 'Guest count'),
  ],
  budgetTotal: [rules.positiveMoney('Budget')],
  date: [rules.isoDate()],
};

/**
 * Validate the whole profile form.
 * Guest count and budget accept null (meaning "not set") without error.
 */
export function validateProfileValues(values) {
  const schema = {
    ownerName: PROFILE_FIELD_RULES.ownerName,
    email: PROFILE_FIELD_RULES.email,
    phone: PROFILE_FIELD_RULES.phone,
    partnerName: PROFILE_FIELD_RULES.partnerName,
    partnerEmail: PROFILE_FIELD_RULES.partnerEmail,
    city: PROFILE_FIELD_RULES.city,
    region: PROFILE_FIELD_RULES.region,
    country: PROFILE_FIELD_RULES.country,
    venueName: PROFILE_FIELD_RULES.venueName,
    date: PROFILE_FIELD_RULES.date,
  };

  const { errors } = validateForm(values, schema);

  // Guest count: only validate when present. An empty field means "not sure".
  if (values.guestCountEstimate != null && values.guestCountEstimate !== '') {
    const guestError = validate(values.guestCountEstimate, PROFILE_FIELD_RULES.guestCountEstimate);
    if (guestError) errors.guestCountEstimate = guestError;
  }

  if (values.budgetTotal != null && values.budgetTotal !== '') {
    const budgetError = validate(values.budgetTotal, PROFILE_FIELD_RULES.budgetTotal);
    if (budgetError) errors.budgetTotal = budgetError;
  }

  // An exact date with no day picked is incoherent - ask for one or loosen the type.
  if (values.dateType === 'exact' && !values.date) {
    errors.date = 'Pick a date, or choose a looser option.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/** Validate a single field - used on blur so the form does not scold mid-word. */
export function validateProfileField(field, value, values = {}) {
  if (field === 'guestCountEstimate') {
    if (value == null || value === '') return null;
    return validate(value, PROFILE_FIELD_RULES.guestCountEstimate);
  }
  if (field === 'budgetTotal') {
    if (value == null || value === '') return null;
    return validate(value, PROFILE_FIELD_RULES.budgetTotal);
  }
  if (field === 'date') {
    const dateError = validate(value, PROFILE_FIELD_RULES.date);
    if (dateError) return dateError;
    if (values.dateType === 'exact' && !value) {
      return 'Pick a date, or choose a looser option.';
    }
    return null;
  }

  const fieldRules = PROFILE_FIELD_RULES[field];
  if (!fieldRules) return null;
  return validate(value, fieldRules);
}

/**
 * Map the first error to the section that contains it, so the screen can
 * scroll or expand the right block after a failed save.
 */
export function firstErrorSection(errors, sectionForField) {
  if (!errors) return null;
  const keys = Object.keys(errors);
  if (keys.length === 0) return null;
  const first = keys[0];
  return sectionForField?.(first) ?? null;
}

export function sectionForProfileField(field) {
  switch (field) {
    case 'ownerName':
    case 'email':
    case 'phone':
      return 'personal';
    case 'partnerName':
    case 'partnerEmail':
    case 'collaborationEnabled':
      return 'partner';
    case 'date':
    case 'dateType':
    case 'city':
    case 'region':
    case 'country':
    case 'venueName':
    case 'guestCountEstimate':
    case 'budgetTotal':
    case 'planningStage':
    case 'ceremonyType':
      return 'wedding';
    case 'styleTags':
    case 'stressors':
      return 'vision';
    default:
      return null;
  }
}

/** Soft length check for optional free-text that may be added later. */
export function validateOptionalNote(value) {
  return validate(value, [rules.maxLength(MAX_PROFILE_NOTE_LENGTH, 'Notes')]);
}
