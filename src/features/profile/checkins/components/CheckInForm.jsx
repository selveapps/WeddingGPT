import React, { useState } from 'react';

import { Button, Stack, Text, TextField } from '@/design-system/components';
import { chooseCheckInPrompt, validateCheckIn } from '../lib/checkinHelpers';

const EMPTY_CHECK_IN = { prompt: '', firstResponse: '', secondResponse: '' };

export function CheckInForm({ previous, onSave }) {
  const [values, setValues] = useState(EMPTY_CHECK_IN);
  const [errors, setErrors] = useState({});

  const usePrompt = () => {
    setValues((current) => ({
      ...current,
      prompt: chooseCheckInPrompt(previous),
    }));
    setErrors({});
  };

  const save = () => {
    const result = validateCheckIn(values);
    setErrors(result.errors);
    if (!result.isValid) return;
    if (
      !onSave({
        ...values,
        prompt: values.prompt.trim(),
        firstResponse: values.firstResponse.trim(),
        secondResponse: values.secondResponse.trim(),
      })
    )
      return;
    setValues(EMPTY_CHECK_IN);
    setErrors({});
  };

  return (
    <Stack gap="sm">
      <TextField
        label="Check-in question"
        value={values.prompt}
        onChangeText={(prompt) => setValues((current) => ({ ...current, prompt }))}
        error={errors.prompt}
        placeholder="What would help us feel supported this week?"
        maxLength={80}
      />
      <Button label="Suggest a question" variant="ghost" size="sm" onPress={usePrompt} />
      <TextField
        label="Your thought (optional)"
        value={values.firstResponse}
        onChangeText={(firstResponse) => setValues((current) => ({ ...current, firstResponse }))}
        placeholder="One thought from you…"
        multiline
        numberOfLines={3}
        maxLength={700}
      />
      <TextField
        label="Your partner's thought (optional)"
        value={values.secondResponse}
        onChangeText={(secondResponse) => setValues((current) => ({ ...current, secondResponse }))}
        placeholder="One thought from your partner…"
        multiline
        numberOfLines={3}
        maxLength={700}
      />
      {errors.responses ? (
        <Text variant="caption" color="danger">
          {errors.responses}
        </Text>
      ) : null}
      <Button label="Save check-in" iconLeft="plus" size="sm" onPress={save} />
      <Text variant="caption" color="subtle">
        This is a shared-device reflection log, not private messaging between accounts.
      </Text>
    </Stack>
  );
}

export default CheckInForm;
