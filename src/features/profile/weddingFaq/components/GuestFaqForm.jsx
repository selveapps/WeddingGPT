import React, { useState } from 'react';
import { Button, Chip, Row, Stack, Text, TextField } from '@/design-system/components';
import { FAQ_CATEGORIES, normalizeFaq, validateFaq } from '../lib/weddingFaqHelpers';

const EMPTY = { question: '', answer: '', category: 'other', visible: true, order: '' };

export function GuestFaqForm({
  initialValues = EMPTY,
  defaultOrder = 1,
  onSave,
  onCancel,
  submitLabel = 'Add guest answer',
}) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues, order: initialValues.order ?? '' });
  const [errors, setErrors] = useState({});
  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const save = () => {
    const result = validateFaq(values);
    setErrors(result.errors);
    if (result.isValid && onSave(normalizeFaq(values, defaultOrder))) setValues(EMPTY);
  };
  return (
    <Stack gap="sm" testID="wedding-faq-form">
      <TextField
        label="Question"
        value={values.question}
        onChangeText={(v) => set('question', v)}
        error={errors.question}
        placeholder="What might a guest ask?"
        maxLength={180}
        testID="faq-question"
      />
      <TextField
        label="Answer"
        value={values.answer}
        onChangeText={(v) => set('answer', v)}
        error={errors.answer}
        placeholder="Write warm, clear guest-facing copy…"
        multiline
        numberOfLines={4}
        maxLength={1200}
        testID="faq-answer"
      />
      <Stack gap="xs">
        <Text variant="label">Category</Text>
        <Row gap="xs" wrap>
          {FAQ_CATEGORIES.map((category) => (
            <Chip
              key={category.value}
              label={category.label}
              selected={values.category === category.value}
              onPress={() => set('category', category.value)}
            />
          ))}
        </Row>
        {errors.category ? (
          <Text variant="caption" color="danger">
            {errors.category}
          </Text>
        ) : null}
      </Stack>
      <Row gap="sm">
        <TextField
          label="Display order"
          value={String(values.order)}
          onChangeText={(v) => set('order', v)}
          error={errors.order}
          placeholder={String(defaultOrder)}
          helper="Smaller numbers appear first."
          keyboardType="number-pad"
          testID="faq-order"
        />
        <Stack gap="xs" style={{ flex: 1 }}>
          <Text variant="label">Guest visibility</Text>
          <Row gap="xs">
            <Chip label="Published" selected={values.visible} onPress={() => set('visible', true)} />
            <Chip label="Hidden" selected={!values.visible} onPress={() => set('visible', false)} />
          </Row>
        </Stack>
      </Row>
      <Row gap="xs">
        <Button label={submitLabel} iconLeft="plus" size="sm" onPress={save} testID="faq-save" />
        {onCancel ? <Button label="Cancel" variant="ghost" size="sm" onPress={onCancel} /> : null}
      </Row>
    </Stack>
  );
}

export default GuestFaqForm;
