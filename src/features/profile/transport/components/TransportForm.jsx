import React, { useState } from 'react';
import { Button, Chip, Row, Stack, Text, TextField } from '@/design-system/components';
import { normalizeTransport, TRANSPORT_STATUSES, validateTransport } from '../lib/transportHelpers';

const EMPTY = { route: '', pickup: '', time: '', provider: '', contact: '', capacity: '', status: 'planned' };
const LABELS = { planned: 'Planned', requested: 'Requested', confirmed: 'Confirmed' };

export function TransportForm({
  initialValues = EMPTY,
  onSave,
  onCancel,
  submitLabel = 'Add transport route',
}) {
  const [values, setValues] = useState({
    ...EMPTY,
    ...initialValues,
    capacity: initialValues.capacity ?? '',
  });
  const [errors, setErrors] = useState({});
  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const save = () => {
    const result = validateTransport(values);
    setErrors(result.errors);
    if (result.isValid && onSave(normalizeTransport(values))) setValues(EMPTY);
  };
  return (
    <Stack gap="sm" testID="transport-form">
      <TextField
        label="Route"
        value={values.route}
        onChangeText={(v) => set('route', v)}
        error={errors.route}
        placeholder="Hotel shuttle, venue return…"
        maxLength={120}
        testID="transport-route"
      />
      <TextField
        label="Pickup point"
        value={values.pickup}
        onChangeText={(v) => set('pickup', v)}
        error={errors.pickup}
        placeholder="Lobby, entrance or landmark"
        maxLength={120}
        testID="transport-pickup"
      />
      <Row gap="sm">
        <TextField
          label="Departure time"
          value={values.time}
          onChangeText={(v) => set('time', v)}
          error={errors.time}
          placeholder="HH:MM"
          maxLength={5}
          testID="transport-time"
        />
        <TextField
          label="Capacity (seats)"
          value={String(values.capacity)}
          onChangeText={(v) => set('capacity', v)}
          error={errors.capacity}
          placeholder="24"
          keyboardType="number-pad"
          testID="transport-capacity"
        />
      </Row>
      <TextField
        label="Provider"
        value={values.provider}
        onChangeText={(v) => set('provider', v)}
        error={errors.provider}
        placeholder="Company or driver"
        maxLength={120}
        testID="transport-provider"
      />
      <TextField
        label="Provider contact (optional)"
        value={values.contact}
        onChangeText={(v) => set('contact', v)}
        placeholder="Phone or email"
        maxLength={160}
        testID="transport-contact"
      />
      <Stack gap="xs">
        <Text variant="label">Booking status</Text>
        <Row gap="xs" wrap>
          {TRANSPORT_STATUSES.map((status) => (
            <Chip
              key={status}
              label={LABELS[status]}
              selected={values.status === status}
              onPress={() => set('status', status)}
            />
          ))}
        </Row>
      </Stack>
      <Row gap="xs">
        <Button label={submitLabel} iconLeft="plus" size="sm" onPress={save} testID="transport-save" />
        {onCancel ? <Button label="Cancel" variant="ghost" size="sm" onPress={onCancel} /> : null}
      </Row>
    </Stack>
  );
}

export default TransportForm;
