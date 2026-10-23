import React, { useState } from 'react';

import { Button, Chip, Row, Stack, Text, TextField } from '@/design-system/components';
import { VISION_CATEGORIES, VISION_MOODS } from '../lib/visionConstants';
import { validateVisionIdea } from '../lib/visionHelpers';

const EMPTY_IDEA = { title: '', category: 'other', moods: [], note: '' };

export function VisionIdeaForm({ onSave }) {
  const [values, setValues] = useState(EMPTY_IDEA);
  const [errors, setErrors] = useState({});
  const toggleMood = (mood) => {
    setValues((current) => ({
      ...current,
      moods: current.moods.includes(mood)
        ? current.moods.filter((item) => item !== mood)
        : [...current.moods, mood],
    }));
  };

  const save = () => {
    const result = validateVisionIdea(values);
    setErrors(result.errors);
    if (!result.isValid) return;
    if (!onSave({ ...values, title: values.title.trim(), note: values.note.trim(), saved: false })) return;
    setValues(EMPTY_IDEA);
    setErrors({});
  };

  return (
    <Stack gap="sm">
      <TextField
        label="Idea"
        value={values.title}
        onChangeText={(title) => setValues((current) => ({ ...current, title }))}
        error={errors.title}
        placeholder="Warm lanterns along the garden path"
        maxLength={90}
      />
      <Stack gap="xs">
        <Text variant="label">Area</Text>
        <Row gap="xs" wrap>
          {VISION_CATEGORIES.map((category) => (
            <Chip
              key={category.value}
              label={category.label}
              selected={values.category === category.value}
              onPress={() => setValues((current) => ({ ...current, category: category.value }))}
            />
          ))}
        </Row>
      </Stack>
      <Stack gap="xs">
        <Text variant="label">Feeling</Text>
        <Row gap="xs" wrap>
          {VISION_MOODS.map((mood) => (
            <Chip
              key={mood.value}
              label={mood.label}
              selected={values.moods.includes(mood.value)}
              onPress={() => toggleMood(mood.value)}
            />
          ))}
        </Row>
      </Stack>
      <TextField
        label="Notes (optional)"
        value={values.note}
        onChangeText={(note) => setValues((current) => ({ ...current, note }))}
        error={errors.note}
        placeholder="Why does this feel like you? What would it take?"
        multiline
        numberOfLines={3}
        maxLength={600}
      />
      <Button label="Save idea" iconLeft="plus" size="sm" onPress={save} />
    </Stack>
  );
}

export default VisionIdeaForm;
