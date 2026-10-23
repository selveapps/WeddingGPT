import React from 'react';

import { Chip, Row, Stack, Text, TextField } from '@/design-system/components';

import { DAY_CHECKLIST_CATEGORIES, DAY_CHECKLIST_PRIORITIES } from '../lib/dayChecklistConstants';

export function DayChecklistTaskForm({ values, errors, onChange }) {
  const set = (key) => (value) => onChange({ ...values, [key]: value });
  const choices = (label, options, key) => (
    <Stack gap="xs">
      <Text variant="label">{label}</Text>
      <Row wrap gap="xs">
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            icon={option.icon}
            selected={values[key] === option.value}
            onPress={() => set(key)(option.value)}
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
    <Stack gap="md" testID="day-checklist-task-form">
      <TextField
        label="Task"
        value={values.title}
        onChangeText={set('title')}
        placeholder="e.g. Hand over the rings"
        error={errors.title}
        maxLength={90}
        autoCapitalize="sentences"
        testID="day-checklist-task-title"
      />
      {choices('Part of the day', DAY_CHECKLIST_CATEGORIES, 'category')}
      <TextField
        label="Time (optional, 24-hour)"
        value={values.time}
        onChangeText={set('time')}
        placeholder="e.g. 14:30"
        error={errors.time}
        helper="Leave blank if the task can happen whenever."
        maxLength={5}
        keyboardType="numbers-and-punctuation"
      />
      {choices('Priority', DAY_CHECKLIST_PRIORITIES, 'priority')}
      <TextField
        label="Owner (optional)"
        value={values.owner}
        onChangeText={set('owner')}
        placeholder="e.g. Alex, coordinator"
        error={errors.owner}
        maxLength={70}
        autoCapitalize="words"
      />
      <TextField
        label="Notes (optional)"
        value={values.note}
        onChangeText={set('note')}
        placeholder="Add a handoff detail or reminder"
        error={errors.note}
        multiline
        numberOfLines={3}
        maxLength={240}
      />
    </Stack>
  );
}

export default DayChecklistTaskForm;
