import React, { useState } from 'react';

import { Button, Chip, Row, Stack, Text, TextField } from '@/design-system/components';
import { DECISION_CATEGORIES } from '../lib/decisionConstants';
import { validateDecision } from '../lib/decisionHelpers';

const EMPTY_DECISION = {
  question: '',
  category: 'other',
  options: '',
  selectedOption: '',
  note: '',
  revisitDate: '',
};

export function DecisionForm({ onSave }) {
  const [values, setValues] = useState(EMPTY_DECISION);
  const [errors, setErrors] = useState({});

  const setValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  const save = () => {
    const result = validateDecision(values);
    setErrors(result.errors);
    if (!result.isValid) return;
    if (
      !onSave({
        ...values,
        question: values.question.trim(),
        options: result.options,
        note: values.note.trim(),
        status: 'open',
      })
    )
      return;
    setValues(EMPTY_DECISION);
    setErrors({});
  };

  return (
    <Stack gap="sm">
      <TextField
        label="Decision to make"
        value={values.question}
        onChangeText={(value) => setValue('question', value)}
        error={errors.question}
        placeholder="Which ceremony reading should we choose?"
        maxLength={100}
      />
      <Stack gap="xs">
        <Text variant="label">Area</Text>
        <Row gap="xs" wrap>
          {DECISION_CATEGORIES.map((category) => (
            <Chip
              key={category.value}
              label={category.label}
              selected={values.category === category.value}
              onPress={() => setValue('category', category.value)}
            />
          ))}
        </Row>
      </Stack>
      <TextField
        label="Options (one per line)"
        value={values.options}
        onChangeText={(value) => setValue('options', value)}
        error={errors.options}
        placeholder={'A short poem\nA letter from family'}
        multiline
        numberOfLines={3}
      />
      <TextField
        label="Revisit date (optional)"
        value={values.revisitDate}
        onChangeText={(value) => setValue('revisitDate', value)}
        error={errors.revisitDate}
        placeholder="YYYY-MM-DD"
        maxLength={10}
      />
      <TextField
        label="Notes or context"
        value={values.note}
        onChangeText={(value) => setValue('note', value)}
        error={errors.note}
        placeholder="What matters most in this choice?"
        multiline
        numberOfLines={3}
        maxLength={500}
      />
      <Button label="Add decision" iconLeft="plus" size="sm" onPress={save} />
    </Stack>
  );
}

export default DecisionForm;
