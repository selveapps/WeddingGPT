import React, { useState } from 'react';

import { Button, Row, Stack, Text, TextField } from '@/design-system/components';
import { JOURNAL_PROMPTS } from '../lib/journalConstants';
import { validateJournalEntry } from '../lib/journalHelpers';

const EMPTY_ENTRY = { title: '', body: '' };

export function JournalEntryForm({ onSave }) {
  const [values, setValues] = useState(EMPTY_ENTRY);
  const [errors, setErrors] = useState({});

  const save = () => {
    const result = validateJournalEntry(values);
    setErrors(result.errors);
    if (!result.isValid) return;
    if (!onSave({ title: values.title.trim(), body: values.body.trim() })) return;
    setValues(EMPTY_ENTRY);
  };

  const insertPrompt = () => {
    const prompt = JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)];
    setValues((current) => ({
      ...current,
      title: current.title || 'A thought to remember',
      body: current.body ? `${current.body}\n\n${prompt}` : prompt,
    }));
    setErrors({});
  };

  return (
    <Stack gap="sm">
      <TextField
        label="Note title"
        value={values.title}
        onChangeText={(title) => setValues((current) => ({ ...current, title }))}
        error={errors.title}
        placeholder="A little thing we want to remember"
        maxLength={80}
      />
      <TextField
        label="Your note"
        value={values.body}
        onChangeText={(body) => setValues((current) => ({ ...current, body }))}
        error={errors.body}
        placeholder="Write it down for the two of you…"
        multiline
        numberOfLines={4}
        maxLength={1200}
      />
      <Row gap="sm">
        <Button
          label="Try a prompt"
          variant="secondary"
          size="sm"
          onPress={insertPrompt}
          style={{ flex: 1 }}
        />
        <Button label="Save note" iconLeft="plus" size="sm" onPress={save} style={{ flex: 1 }} />
      </Row>
      <Text variant="caption" color="subtle">
        Notes are saved with this wedding workspace on this device.
      </Text>
    </Stack>
  );
}

export default JournalEntryForm;
