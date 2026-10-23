import React, { useState } from 'react';

import { Button, Chip, Row, Stack, Text, TextField } from '@/design-system/components';
import { GOAL_CATEGORIES, GOAL_PRIORITIES } from '../lib/goalConstants';
import { validateGoal } from '../lib/goalHelpers';

const EMPTY_GOAL = { title: '', details: '', dueDate: '', category: 'planning', priority: 'steady' };

export function GoalForm({ onSave }) {
  const [values, setValues] = useState(EMPTY_GOAL);
  const [errors, setErrors] = useState({});

  const save = () => {
    const result = validateGoal(values);
    setErrors(result.errors);
    if (!result.isValid) return;
    if (
      !onSave({ ...values, title: values.title.trim(), details: values.details.trim(), completed: false })
    ) {
      return;
    }
    setValues(EMPTY_GOAL);
    setErrors({});
  };

  const choices = (label, options, key) => (
    <Stack gap="xs">
      <Text variant="label">{label}</Text>
      <Row wrap gap="xs">
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={values[key] === option.value}
            onPress={() => setValues((current) => ({ ...current, [key]: option.value }))}
          />
        ))}
      </Row>
      {errors[key] ? (
        <Text variant="caption" color="danger">
          {errors[key]}
        </Text>
      ) : null}
    </Stack>
  );

  return (
    <Stack gap="sm">
      <TextField
        label="A goal for the two of you"
        value={values.title}
        onChangeText={(title) => setValues((current) => ({ ...current, title }))}
        error={errors.title}
        placeholder="Make time for one screen-free evening"
        maxLength={90}
      />
      {choices('Goal area', GOAL_CATEGORIES, 'category')}
      {choices('Planning pace', GOAL_PRIORITIES, 'priority')}
      <TextField
        label="Target date (optional)"
        value={values.dueDate}
        onChangeText={(dueDate) => setValues((current) => ({ ...current, dueDate }))}
        error={errors.dueDate}
        placeholder="YYYY-MM-DD"
        maxLength={10}
      />
      <TextField
        label="A little context (optional)"
        value={values.details}
        onChangeText={(details) => setValues((current) => ({ ...current, details }))}
        error={errors.details}
        placeholder="What would make this feel good to accomplish?"
        multiline
        numberOfLines={3}
        maxLength={500}
      />
      <Button label="Add shared goal" iconLeft="plus" size="sm" onPress={save} />
    </Stack>
  );
}

export default GoalForm;
