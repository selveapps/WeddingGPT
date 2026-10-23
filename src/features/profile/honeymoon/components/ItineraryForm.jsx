import React, { useState } from 'react';
import { Button, Chip, Row, Stack, Text, TextField } from '@/design-system/components';
import { HONEYMOON_STATUSES, normalizeItineraryItem, validateItineraryItem } from '../lib/honeymoonHelpers';

const EMPTY = {
  item: '',
  destination: '',
  date: '',
  time: '',
  bookingReference: '',
  status: 'planned',
  notes: '',
};
const LABELS = { planned: 'Planned', booked: 'Booked', complete: 'Complete' };

export function ItineraryForm({ initialValues = EMPTY, onSave, onCancel, submitLabel = 'Add to itinerary' }) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });
  const [errors, setErrors] = useState({});
  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const save = () => {
    const result = validateItineraryItem(values);
    setErrors(result.errors);
    if (result.isValid && onSave(normalizeItineraryItem(values))) setValues(EMPTY);
  };
  return (
    <Stack gap="sm" testID="honeymoon-form">
      <TextField
        label="Itinerary item"
        value={values.item}
        onChangeText={(v) => set('item', v)}
        error={errors.item}
        placeholder="Hotel check-in, excursion, dinner…"
        maxLength={120}
        testID="honeymoon-item"
      />
      <TextField
        label="Destination"
        value={values.destination}
        onChangeText={(v) => set('destination', v)}
        error={errors.destination}
        placeholder="City, area or venue"
        maxLength={120}
        testID="honeymoon-destination"
      />
      <Row gap="sm">
        <TextField
          label="Date"
          value={values.date}
          onChangeText={(v) => set('date', v)}
          error={errors.date}
          placeholder="YYYY-MM-DD"
          maxLength={10}
          testID="honeymoon-date"
        />
        <TextField
          label="Time"
          value={values.time}
          onChangeText={(v) => set('time', v)}
          error={errors.time}
          placeholder="HH:MM"
          maxLength={5}
          testID="honeymoon-time"
        />
      </Row>
      <TextField
        label="Booking reference (optional)"
        value={values.bookingReference}
        onChangeText={(v) => set('bookingReference', v)}
        placeholder="Confirmation code"
        maxLength={80}
        testID="honeymoon-reference"
      />
      <Stack gap="xs">
        <Text variant="label">Booking status</Text>
        <Row gap="xs" wrap>
          {HONEYMOON_STATUSES.map((status) => (
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
        placeholder="Travel details or reminders…"
        multiline
        numberOfLines={2}
        maxLength={500}
        testID="honeymoon-notes"
      />
      <Row gap="xs">
        <Button label={submitLabel} iconLeft="plus" size="sm" onPress={save} testID="honeymoon-save" />
        {onCancel ? <Button label="Cancel" variant="ghost" size="sm" onPress={onCancel} /> : null}
      </Row>
    </Stack>
  );
}

export default ItineraryForm;
