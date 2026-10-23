import React, { useState } from 'react';

import { Button, Chip, Row, Stack, Text, TextField } from '@/design-system/components';
import { MILESTONE_TYPES } from '../lib/milestoneConstants';
import { validateMilestone } from '../lib/milestoneHelpers';

const EMPTY_MILESTONE = { title: '', date: '', type: 'relationship', note: '' };

export function MilestoneForm({ onSave }) {
  const [values, setValues] = useState(EMPTY_MILESTONE);
  const [errors, setErrors] = useState({});

  const save = () => {
    const result = validateMilestone(values);
    setErrors(result.errors);
    if (!result.isValid) return;
    if (!onSave({ ...values, title: values.title.trim(), note: values.note.trim(), completed: false }))
      return;
    setValues(EMPTY_MILESTONE);
    setErrors({});
  };

  return (
    <Stack gap="sm">
      <TextField
        label="Milestone"
        value={values.title}
        onChangeText={(title) => setValues((current) => ({ ...current, title }))}
        error={errors.title}
        placeholder="Our first date"
        maxLength={90}
      />
      <TextField
        label="Date"
        value={values.date}
        onChangeText={(date) => setValues((current) => ({ ...current, date }))}
        error={errors.date}
        placeholder="YYYY-MM-DD"
        maxLength={10}
      />
      <Stack gap="xs">
        <Text variant="label">Milestone type</Text>
        <Row wrap gap="xs">
          {MILESTONE_TYPES.map((type) => (
            <Chip
              key={type.value}
              label={type.label}
              selected={values.type === type.value}
              onPress={() => setValues((current) => ({ ...current, type: type.value }))}
            />
          ))}
        </Row>
      </Stack>
      <TextField
        label="A note to go with it"
        value={values.note}
        onChangeText={(note) => setValues((current) => ({ ...current, note }))}
        error={errors.note}
        placeholder="What made this day special?"
        multiline
        numberOfLines={3}
        maxLength={400}
      />
      <Button label="Add milestone" iconLeft="plus" size="sm" onPress={save} />
    </Stack>
  );
}

export default MilestoneForm;
