import React, { useState } from 'react';

import { BottomSheet, Button, Row, Stack, Text, TextField } from '@/design-system/components';
import { DateType } from '@/models';

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function DateSheet({ visible, onClose, wedding, onSave }) {
  if (!visible) return null;
  return <DateSheetForm key={wedding?.date || 'unset'} onClose={onClose} wedding={wedding} onSave={onSave} />;
}

function DateSheetForm({ onClose, wedding, onSave }) {
  const [date, setDate] = useState(wedding?.date?.slice(0, 10) || '');
  const [error, setError] = useState('');

  const save = () => {
    if (date && !isValidDate(date)) {
      setError('Enter a real date in YYYY-MM-DD format.');
      return;
    }

    onSave({
      date: date || null,
      dateType: date ? DateType.EXACT : DateType.UNDECIDED,
    });
  };

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title="Wedding date"
      subtitle="Add or update the date for your countdown."
      footer={
        <Row gap="xs">
          <Button label="Cancel" variant="secondary" style={{ flex: 1 }} onPress={onClose} />
          <Button label="Save date" style={{ flex: 1 }} onPress={save} />
        </Row>
      }
    >
      <Stack gap="md">
        <TextField
          label="Date"
          value={date}
          onChangeText={(value) => {
            setDate(value);
            if (error) setError('');
          }}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
          autoCorrect={false}
          error={error}
          helper="Leave blank if you have not decided yet."
        />
        <Text variant="caption" color="subtle">
          Your date stays on this device unless you choose to sync your workspace.
        </Text>
      </Stack>
    </BottomSheet>
  );
}

export default DateSheet;
