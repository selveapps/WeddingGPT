import { rules, validate } from '@/lib/validation';

const fieldRules = {
  name: [rules.required('A vendor name'), rules.maxLength(100, 'The vendor name')],
  contactName: [rules.maxLength(80, 'The contact name')],
  email: [rules.email()],
  phone: [rules.phone()],
  website: [rules.maxLength(240, 'The website')],
  city: [rules.maxLength(80, 'The city')],
  notes: [rules.maxLength(1000, 'Notes')],
  priceHint: [rules.maxLength(100, 'The price range')],
  quoteScope: [rules.maxLength(500, 'The quote details')],
};

function validateWebsite(value) {
  if (!value) return null;
  const address = String(value).trim();
  return /^(https?:\/\/)?([a-z\d-]+\.)+[a-z]{2,}(:\d+)?(\/[^\s]*)?$/i.test(address)
    ? null
    : 'Enter a valid website address.';
}

export function validateVendorValues(values) {
  const errors = {};
  for (const [field, fieldValidationRules] of Object.entries(fieldRules)) {
    const error = validate(values[field], fieldValidationRules);
    if (error) errors[field] = error;
  }

  const websiteError = validateWebsite(values.website);
  if (websiteError) errors.website = websiteError;

  for (const field of ['quotedAmount', 'depositAmount', 'finalAmount']) {
    const amount = values[field];
    if (amount == null || amount === '') continue;
    if (!Number.isFinite(amount) || amount < 0) {
      errors[field] = 'Enter a valid amount of zero or more.';
    }
  }

  if (
    values.quotedAmount != null &&
    (values.depositAmount ?? 0) + (values.finalAmount ?? 0) > values.quotedAmount
  ) {
    errors.finalAmount = 'Payment milestones cannot exceed the quoted amount.';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateVendorField(field, value, values = {}) {
  if (field === 'website') {
    return validate(value, fieldRules.website) ?? validateWebsite(value);
  }
  if (field === 'quotedAmount' || field === 'depositAmount' || field === 'finalAmount') {
    if (value == null || value === '') return null;
    if (!Number.isFinite(value) || value < 0) return 'Enter a valid amount of zero or more.';
    if (
      field !== 'quotedAmount' &&
      values.quotedAmount != null &&
      (field === 'depositAmount' ? value + (values.finalAmount ?? 0) : value + (values.depositAmount ?? 0)) >
        values.quotedAmount
    ) {
      return 'Payment milestones cannot exceed the quoted amount.';
    }
    return null;
  }
  return fieldRules[field] ? validate(value, fieldRules[field]) : null;
}
