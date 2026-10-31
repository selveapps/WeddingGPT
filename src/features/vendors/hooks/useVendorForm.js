import { useCallback, useState } from 'react';

import { EMPTY_VENDOR_VALUES } from '../lib/vendorConstants';
import { validateVendorField, validateVendorValues } from '../lib/vendorValidation';
import { formValuesFromVendor } from './useVendors';

const MONEY_FIELDS = ['quotedAmount', 'depositAmount', 'finalAmount'];
const TEXT_FIELDS = [
  'name',
  'contactName',
  'email',
  'phone',
  'website',
  'city',
  'notes',
  'priceHint',
  'quoteScope',
];

function initialValues(vendor) {
  const values = { ...EMPTY_VENDOR_VALUES };
  const fromVendor = formValuesFromVendor(vendor) ?? {};
  for (const key of Object.keys(values)) {
    if (fromVendor[key] !== undefined && fromVendor[key] !== null) values[key] = fromVendor[key];
  }
  return values;
}

/** Form state for adding or editing a vendor; validates on blur and on submit. */
export function useVendorForm(initial, onSubmit) {
  const [values, setValues] = useState(() => initialValues(initial));
  const [errors, setErrors] = useState({});

  const setField = useCallback((field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      // The three amounts are checked against each other, so editing one clears all three.
      const related = MONEY_FIELDS.includes(field) ? MONEY_FIELDS : [field];
      if (!related.some((key) => current[key])) return current;
      const next = { ...current };
      related.forEach((key) => delete next[key]);
      return next;
    });
  }, []);

  const blurField = useCallback(
    (field) => {
      const error = validateVendorField(field, values[field], values);
      setErrors((current) => {
        if (!error && !current[field]) return current;
        if (error) return { ...current, [field]: error };
        const next = { ...current };
        delete next[field];
        return next;
      });
    },
    [values]
  );

  const submit = useCallback(() => {
    const result = validateVendorValues(values);
    setErrors(result.errors);
    if (!result.isValid) return false;

    const trimmed = { ...values };
    for (const key of TEXT_FIELDS) trimmed[key] = String(values[key] ?? '').trim();
    onSubmit?.(trimmed);
    return true;
  }, [onSubmit, values]);

  return { values, errors, setField, blurField, submit };
}

export default useVendorForm;
