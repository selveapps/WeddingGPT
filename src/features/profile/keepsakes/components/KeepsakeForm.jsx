import React, { useState } from 'react';

import { Button, Chip, Row, Stack, Text, TextField } from '@/design-system/components';
import { KEEPSAKE_CATEGORIES } from '../lib/keepsakeConstants';
import { validateKeepsake } from '../lib/keepsakeHelpers';

const EMPTY_KEEPSAKE = { title: '', category: 'story', date: '', note: '' };

export function KeepsakeForm({ onSave }) {
  const [values, setValues] = useState(EMPTY_KEEPSAKE);
  const [errors, setErrors] = useState({});

  const save = () => {
    const validation = validateKeepsake(values);
    setErrors(validation.errors);
    if (!validation.isValid) return;
    if (!onSave({ ...values, title: values.title.trim(), note: values.note.trim() })) return;
    setValues(EMPTY_KEEPSAKE);
    setErrors({});
  };

  return (
    <Stack gap="sm">
      <TextField
        label="Keepsake name"
        value={values.title}
        onChangeText={(title) => setValues((current) => ({ ...current, title }))}
        error={errors.title}
        placeholder="The handwritten vows"
        maxLength={80}
      />
      <Stack gap="xs">
        <Text variant="label">Type</Text>
        <Row wrap gap="xs">
          {KEEPSAKE_CATEGORIES.map((category) => (
            <Chip
              key={category.value}
              label={category.label}
              selected={values.category === category.value}
              onPress={() => setValues((current) => ({ ...current, category: category.value }))}
            />
          ))}
        </Row>
        {errors.category ? (
          <Text variant="caption" color="danger">
            {errors.category}
          </Text>
        ) : null}
      </Stack>
      <TextField
        label="Date (optional)"
        value={values.date}
        onChangeText={(date) => setValues((current) => ({ ...current, date }))}
        error={errors.date}
        placeholder="YYYY-MM-DD"
        maxLength={10}
      />
      <TextField
        label="Why you want to remember it"
        value={values.note}
        onChangeText={(note) => setValues((current) => ({ ...current, note }))}
        error={errors.note}
        placeholder="Add a little context…"
        multiline
        numberOfLines={3}
        maxLength={500}
      />
      <Button label="Save keepsake" iconLeft="plus" size="sm" onPress={save} />
    </Stack>
  );
}

export default KeepsakeForm;
