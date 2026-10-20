import { useCallback, useState } from 'react';

import { EMPTY_BOOKING_VALUES } from '../lib/bookingConstants';
import { validateBookingField, validateBookingValues } from '../lib/bookingValidation';

function valuesForBooking(booking) {
  return { ...EMPTY_BOOKING_VALUES, ...(booking ?? {}) };
}

export function useBookingForm(initial, onSubmit) {
  const [values, setValues] = useState(() => valuesForBooking(initial));
  const [errors, setErrors] = useState({});

  const setField = useCallback((field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      const relatedFields =
        field === 'quotedAmount' || field === 'depositAmount' || field === 'finalAmount'
          ? ['quotedAmount', 'depositAmount', 'finalAmount']
          : [field];
      let changed = false;
      relatedFields.forEach((relatedField) => {
        if (next[relatedField]) {
          delete next[relatedField];
          changed = true;
        }
      });
      if (!changed) return current;
      return next;
    });
  }, []);

  const blurField = useCallback(
    (field) => {
      const error = validateBookingField(field, values[field], values);
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
    const result = validateBookingValues(values);
    setErrors(result.errors);
    if (!result.isValid) return false;

    onSubmit?.({
      ...values,
      name: values.name.trim(),
      contactName: values.contactName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      website: values.website.trim(),
      city: values.city.trim(),
      notes: values.notes.trim(),
      priceHint: values.priceHint.trim(),
      quoteScope: values.quoteScope.trim(),
    });
    return true;
  }, [onSubmit, values]);

  return { values, errors, setField, blurField, submit };
}
