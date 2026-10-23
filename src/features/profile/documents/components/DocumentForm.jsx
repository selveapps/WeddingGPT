import React, { useState } from 'react';

import { Button, Chip, Row, Stack, Text, TextField } from '@/design-system/components';
import { DOCUMENT_TYPES } from '../lib/documentConstants';
import { validateDocument } from '../lib/documentHelpers';

const EMPTY_DOCUMENT = { type: 'venue', title: '', note: '', reviewDate: '' };

export function DocumentForm({ onSave }) {
  const [values, setValues] = useState(EMPTY_DOCUMENT);
  const [errors, setErrors] = useState({});

  const save = () => {
    const result = validateDocument(values);
    setErrors(result.errors);
    if (!result.isValid) return;
    if (!onSave({ ...values, title: values.title.trim(), note: values.note.trim(), completed: false })) {
      return;
    }
    setValues(EMPTY_DOCUMENT);
    setErrors({});
  };

  const selectedType = DOCUMENT_TYPES.find((item) => item.value === values.type);
  return (
    <Stack gap="sm">
      <Text variant="label">Checklist item</Text>
      <Row gap="xs" wrap>
        {DOCUMENT_TYPES.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            selected={values.type === item.value}
            onPress={() => setValues((current) => ({ ...current, type: item.value }))}
          />
        ))}
      </Row>
      {errors.type ? (
        <Text variant="caption" color="danger">
          {errors.type}
        </Text>
      ) : null}
      {values.type === 'other' ? (
        <TextField
          label="Document name"
          value={values.title}
          onChangeText={(title) => setValues((current) => ({ ...current, title }))}
          error={errors.title}
          placeholder="What do you need to keep track of?"
          maxLength={80}
        />
      ) : (
        <Text variant="caption" color="muted">
          {selectedType?.label}
        </Text>
      )}
      <TextField
        label="Review or renewal date (optional)"
        value={values.reviewDate}
        onChangeText={(reviewDate) => setValues((current) => ({ ...current, reviewDate }))}
        error={errors.reviewDate}
        placeholder="YYYY-MM-DD"
        maxLength={10}
      />
      <TextField
        label="Notes (optional)"
        value={values.note}
        onChangeText={(note) => setValues((current) => ({ ...current, note }))}
        error={errors.note}
        placeholder="Where it is saved, who to contact, or what to review…"
        multiline
        numberOfLines={3}
        maxLength={300}
      />
      <Button label="Add checklist item" iconLeft="plus" size="sm" onPress={save} />
    </Stack>
  );
}

export default DocumentForm;
