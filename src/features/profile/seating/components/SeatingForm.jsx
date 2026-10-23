import React, { useState } from 'react';
import { Button, Row, Stack, Text, TextField } from '@/design-system/components';
import { normaliseSeat, validateSeat } from '../lib/seatingHelpers';

const EMPTY = { guest: '', table: '', seat: '', note: '' };

export function SeatingForm({ initialValue, records, onSave, onCancel }) {
  const [values, setValues] = useState(() => ({ ...EMPTY, ...initialValue }));
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => setValues((current) => ({ ...current, [key]: value }));
  const save = () => {
    const result = validateSeat(values, records, initialValue?.id);
    setErrors(result.errors);
    if (result.isValid && onSave(normaliseSeat(values))) setValues(EMPTY);
  };
  return (
    <Stack gap="sm" testID="seating-form">
      <TextField
        label="Guest or household"
        value={values.guest}
        onChangeText={set('guest')}
        error={errors.guest}
        maxLength={80}
        placeholder="Guest name"
      />
      <Row gap="sm">
        <Stack style={{ flex: 1 }}>
          <TextField
            label="Table"
            value={values.table}
            onChangeText={set('table')}
            error={errors.position}
            maxLength={50}
            placeholder="e.g. Table 4"
          />
        </Stack>
        <Stack style={{ flex: 1 }}>
          <TextField
            label="Seat / position"
            value={values.seat}
            onChangeText={set('seat')}
            maxLength={30}
            placeholder="e.g. A or 2"
          />
        </Stack>
      </Row>
      {errors.position ? (
        <Text variant="caption" color="danger">
          {errors.position}
        </Text>
      ) : null}
      <TextField
        label="Seating note"
        value={values.note}
        onChangeText={set('note')}
        error={errors.note}
        maxLength={300}
        multiline
        numberOfLines={2}
        placeholder="Mobility, family grouping, etc."
      />
      <Row gap="sm">
        <Button
          label={initialValue ? 'Save changes' : 'Assign guest'}
          size="sm"
          onPress={save}
          testID="seating-save"
        />
        {onCancel ? <Button label="Cancel" variant="ghost" size="sm" onPress={onCancel} /> : null}
      </Row>
    </Stack>
  );
}

export default SeatingForm;
