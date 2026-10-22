import React from 'react';

import { Stack, TextField } from '@/design-system/components';

import { TIMELINE_COPY } from '../lib/timelineConstants';

export function TimelineEventForm({ values, errors, onChange }) {
  const set = (key) => (value) => onChange({ ...values, [key]: value });

  return (
    <Stack gap="md" testID="timeline-event-form">
      <TextField
        label={TIMELINE_COPY.titleLabel}
        value={values.title}
        onChangeText={set('title')}
        placeholder={TIMELINE_COPY.titlePlaceholder}
        error={errors.title}
        maxLength={70}
        autoCapitalize="sentences"
        testID="timeline-event-title"
      />
      <TextField
        label={TIMELINE_COPY.timeLabel}
        value={values.time}
        onChangeText={set('time')}
        placeholder={TIMELINE_COPY.timePlaceholder}
        helper="Use 24-hour time, such as 09:30 or 17:00."
        error={errors.time}
        maxLength={5}
        keyboardType="numbers-and-punctuation"
        testID="timeline-event-time"
      />
      <TextField
        label={TIMELINE_COPY.ownerLabel}
        value={values.owner}
        onChangeText={set('owner')}
        placeholder={TIMELINE_COPY.ownerPlaceholder}
        error={errors.owner}
        maxLength={70}
        autoCapitalize="words"
      />
      <TextField
        label={TIMELINE_COPY.noteLabel}
        value={values.note}
        onChangeText={set('note')}
        placeholder={TIMELINE_COPY.notePlaceholder}
        error={errors.note}
        maxLength={220}
        multiline
        numberOfLines={3}
      />
    </Stack>
  );
}
