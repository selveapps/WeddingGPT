import React, { useEffect, useState } from 'react';

import { TextField } from '@/design-system/components';
import { currencySymbol, parseMoneyInput, toMajor, DEFAULT_CURRENCY } from '@/lib/currency';

/**
 * A money input over the plain `TextField`.
 *
 * The model stores minor units; people type major ones. This component owns
 * that conversion so no screen has to, and keeps the raw text in local state
 * while the field is being edited - reformatting on every keystroke would fight
 * the cursor and make "1500" impossible to type without it jumping around.
 *
 * The parent still receives minor units, and `null` rather than `0` when the
 * field is empty: "I have not said yet" and "it is free" are different answers.
 */
export function MoneyField({
  label = 'Amount',
  value,
  onChange,
  currency = DEFAULT_CURRENCY,
  helper,
  error,
  placeholder = '0',
  ...rest
}) {
  const [text, setText] = useState(() =>
    value === null || value === undefined ? '' : String(toMajor(value, currency))
  );

  // Re-sync when the value changes from outside (a reset, or a loaded record).
  // Guarded so an external echo of what the user just typed does not rewrite
  // the text they are still editing.
  useEffect(() => {
    const parsed = parseMoneyInput(text, currency);
    if (parsed === value) return;
    setText(value === null || value === undefined ? '' : String(toMajor(value, currency)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, currency]);

  return (
    <TextField
      label={label}
      value={text}
      onChangeText={(next) => {
        setText(next);
        onChange(parseMoneyInput(next, currency));
      }}
      prefix={currencySymbol(currency)}
      keyboardType="number-pad"
      placeholder={placeholder}
      helper={helper}
      error={error}
      {...rest}
    />
  );
}

export default MoneyField;
