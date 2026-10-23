import React, { useState } from 'react';
import { Button, Chip, Row, Stack, Text, TextField } from '@/design-system/components';
import { normaliseGuestRsvp, RSVP_STATUSES, validateGuestRsvp } from '../lib/guestRsvpHelpers';

const EMPTY = { name: '', rsvp: 'pending', partySize: '1', meal: '', notes: '' };

export function GuestRsvpForm({ initialValue, onSave, onCancel }) {
  const [values, setValues] = useState(() => ({
    ...EMPTY,
    ...initialValue,
    partySize: String(initialValue?.partySize ?? 1),
  }));
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => setValues((current) => ({ ...current, [key]: value }));
  const save = () => {
    const result = validateGuestRsvp(values);
    setErrors(result.errors);
    if (result.isValid && onSave(normaliseGuestRsvp(values))) setValues(EMPTY);
  };
  return (
    <Stack gap="sm" testID="guest-rsvp-form">
      <TextField
        label="Guest or household"
        value={values.name}
        onChangeText={set('name')}
        error={errors.name}
        maxLength={80}
        placeholder="e.g. Avery family"
      />
      <Text variant="label">RSVP</Text>
      <Row gap="xs" wrap>
        {RSVP_STATUSES.map((status) => (
          <Chip
            key={status}
            label={status === 'yes' ? 'Attending' : status === 'no' ? 'Declined' : 'Pending'}
            selected={values.rsvp === status}
            onPress={() => set('rsvp')(status)}
            testID={`rsvp-${status}`}
          />
        ))}
      </Row>
      {errors.rsvp ? (
        <Text variant="caption" color="danger">
          {errors.rsvp}
        </Text>
      ) : null}
      <TextField
        label="Party size"
        value={values.partySize}
        onChangeText={set('partySize')}
        error={errors.partySize}
        keyboardType="number-pad"
        maxLength={2}
      />
      <TextField
        label="Meal preference"
        value={values.meal}
        onChangeText={set('meal')}
        error={errors.meal}
        maxLength={80}
        placeholder="Vegetarian, vegan, etc."
      />
      <TextField
        label="Notes"
        value={values.notes}
        onChangeText={set('notes')}
        error={errors.notes}
        maxLength={300}
        multiline
        numberOfLines={2}
        placeholder="Accessibility or follow-up details"
      />
      <Row gap="sm">
        <Button
          label={initialValue ? 'Save changes' : 'Add guest'}
          iconLeft={initialValue ? undefined : 'plus'}
          size="sm"
          onPress={save}
          testID="guest-rsvp-save"
        />
        {onCancel ? <Button label="Cancel" variant="ghost" size="sm" onPress={onCancel} /> : null}
      </Row>
    </Stack>
  );
}

export default GuestRsvpForm;
