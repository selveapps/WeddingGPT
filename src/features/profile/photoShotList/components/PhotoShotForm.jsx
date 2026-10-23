import React, { useState } from 'react';
import { Button, Chip, Row, Stack, Text, TextField } from '@/design-system/components';
import { normalisePhotoShot, SHOT_PRIORITIES, validatePhotoShot } from '../lib/photoShotListHelpers';

const EMPTY = { shot: '', group: '', priority: 'important', completed: false };
const LABELS = { 'must-have': 'Must-have', important: 'Important', 'nice-to-have': 'Nice to have' };

export function PhotoShotForm({ initialValue, onSave, onCancel }) {
  const [values, setValues] = useState(() => ({ ...EMPTY, ...initialValue }));
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => setValues((current) => ({ ...current, [key]: value }));
  const save = () => {
    const result = validatePhotoShot(values);
    setErrors(result.errors);
    if (result.isValid && onSave(normalisePhotoShot(values))) setValues(EMPTY);
  };
  return (
    <Stack gap="sm" testID="photo-shot-form">
      <TextField
        label="Photo to capture"
        value={values.shot}
        onChangeText={set('shot')}
        error={errors.shot}
        maxLength={120}
        placeholder="e.g. Grandparents seeing the couple"
      />
      <TextField
        label="Group or category"
        value={values.group}
        onChangeText={set('group')}
        error={errors.group}
        maxLength={60}
        placeholder="Family, ceremony, details…"
      />
      <Text variant="label">Priority</Text>
      <Row gap="xs" wrap>
        {SHOT_PRIORITIES.map((priority) => (
          <Chip
            key={priority}
            label={LABELS[priority]}
            selected={values.priority === priority}
            onPress={() => set('priority')(priority)}
            testID={`photo-priority-${priority}`}
          />
        ))}
      </Row>
      <Row gap="sm">
        <Button
          label={initialValue ? 'Save changes' : 'Add shot'}
          size="sm"
          onPress={save}
          testID="photo-shot-save"
        />
        {onCancel ? <Button label="Cancel" variant="ghost" size="sm" onPress={onCancel} /> : null}
      </Row>
    </Stack>
  );
}

export default PhotoShotForm;
