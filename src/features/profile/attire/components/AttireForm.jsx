import React, { useState } from 'react';
import { Button, Chip, Row, Stack, Text, TextField } from '@/design-system/components';
import { ATTIRE_STATUSES, normalizeAttire, validateAttire } from '../lib/attireHelpers';

const EMPTY = { person: '', garment: '', fittingDate: '', pickupDate: '', status: 'planned', notes: '' };
const LABELS = { planned: 'Planned', fitting: 'Fitting', ready: 'Ready', 'picked-up': 'Picked up' };

export function AttireForm({ initialValues = EMPTY, onSave, onCancel, submitLabel = 'Add attire item' }) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });
  const [errors, setErrors] = useState({});
  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const save = () => {
    const result = validateAttire(values);
    setErrors(result.errors);
    if (result.isValid && onSave(normalizeAttire(values))) setValues(EMPTY);
  };
  return (
    <Stack gap="sm" testID="attire-form">
      <TextField
        label="Person"
        value={values.person}
        onChangeText={(v) => set('person', v)}
        error={errors.person}
        placeholder="Who is this for?"
        maxLength={80}
        testID="attire-person"
      />
      <TextField
        label="Garment or accessory"
        value={values.garment}
        onChangeText={(v) => set('garment', v)}
        error={errors.garment}
        placeholder="Dress, suit, shoes…"
        maxLength={100}
        testID="attire-garment"
      />
      <Row gap="sm">
        <TextField
          label="Fitting date"
          value={values.fittingDate}
          onChangeText={(v) => set('fittingDate', v)}
          error={errors.fittingDate}
          placeholder="YYYY-MM-DD"
          maxLength={10}
          testID="attire-fitting-date"
        />
        <TextField
          label="Pickup date"
          value={values.pickupDate}
          onChangeText={(v) => set('pickupDate', v)}
          error={errors.pickupDate}
          placeholder="YYYY-MM-DD"
          maxLength={10}
          testID="attire-pickup-date"
        />
      </Row>
      <Stack gap="xs">
        <Text variant="label">Progress</Text>
        <Row gap="xs" wrap>
          {ATTIRE_STATUSES.map((status) => (
            <Chip
              key={status}
              label={LABELS[status]}
              selected={values.status === status}
              onPress={() => set('status', status)}
            />
          ))}
        </Row>
      </Stack>
      <TextField
        label="Notes"
        value={values.notes}
        onChangeText={(v) => set('notes', v)}
        placeholder="Alterations, measurements or reminders…"
        multiline
        numberOfLines={2}
        maxLength={400}
        testID="attire-notes"
      />
      <Row gap="xs">
        <Button label={submitLabel} iconLeft="check" size="sm" onPress={save} testID="attire-save" />
        {onCancel ? <Button label="Cancel" variant="ghost" size="sm" onPress={onCancel} /> : null}
      </Row>
    </Stack>
  );
}

export default AttireForm;
