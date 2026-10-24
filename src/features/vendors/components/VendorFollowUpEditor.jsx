import React, { useState } from 'react';

import { Button, Card, ConfirmSheet, Stack, Text, TextField, useToast } from '@/design-system/components';
import { DateField } from '@/features/shared/DateField';

export function VendorFollowUpEditor({ date: initialDate, note: initialNote, onSave, onClear }) {
  const toast = useToast();
  const [date, setDate] = useState(initialDate ?? null);
  const [note, setNote] = useState(initialNote ?? '');
  const [confirmClear, setConfirmClear] = useState(false);

  const save = () => {
    if (!date) {
      toast.error('Choose a follow-up date first.');
      return;
    }
    if (!onSave?.({ date, note })) {
      toast.error('Could not save this follow-up.');
      return;
    }
    toast.success('Follow-up saved');
  };

  const clear = () => {
    if (!onClear?.()) {
      toast.error('Could not clear this follow-up.');
      return;
    }
    setDate(null);
    setNote('');
    setConfirmClear(false);
    toast.success('Follow-up cleared');
  };

  return (
    <Card tone="muted">
      <Stack gap="sm">
        <Text variant="bodyStrong">{initialDate ? 'Update follow-up' : 'Plan a follow-up'}</Text>
        <Text variant="bodySm" color="muted">
          Keep the next vendor check-in visible in your shortlist.
        </Text>
        <DateField label="Follow-up date" value={date} onChange={setDate} placeholder="Choose a date" />
        <TextField
          label="What to follow up on (optional)"
          value={note}
          onChangeText={setNote}
          placeholder="Ask about availability, contract terms or a revised quote"
          multiline
          numberOfLines={3}
          maxLength={300}
        />
        <Button label="Save follow-up" variant="secondary" iconLeft="calendar" onPress={save} />
        {initialDate ? (
          <Button
            label="Clear follow-up"
            variant="ghost"
            size="sm"
            iconLeft="trash"
            onPress={() => setConfirmClear(true)}
          />
        ) : null}
      </Stack>
      <ConfirmSheet
        visible={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clear}
        title="Clear this follow-up?"
        message="The follow-up date and note will be removed from this vendor."
        confirmLabel="Clear follow-up"
        cancelLabel="Keep follow-up"
        destructive
        icon="trash"
      />
    </Card>
  );
}

export default VendorFollowUpEditor;
