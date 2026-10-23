import React, { useState } from 'react';

import { Button, Chip, Row, Stack, Text, TextField } from '@/design-system/components';
import { PARTY_ROLES, PARTY_SIDES } from '../lib/partyConstants';
import { normalisePartyMember, validatePartyMember } from '../lib/partyHelpers';

const EMPTY_MEMBER = { name: '', role: 'attendant', side: 'both', email: '', phone: '', note: '' };

export function PartyMemberForm({ onSave }) {
  const [values, setValues] = useState(EMPTY_MEMBER);
  const [errors, setErrors] = useState({});

  const setValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const choices = (label, items, key) => (
    <Stack gap="xs">
      <Text variant="label">{label}</Text>
      <Row gap="xs" wrap>
        {items.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            selected={values[key] === item.value}
            onPress={() => setValue(key, item.value)}
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

  const save = () => {
    const result = validatePartyMember(values);
    setErrors(result.errors);
    if (!result.isValid) return;
    if (!onSave(normalisePartyMember(values))) return;
    setValues(EMPTY_MEMBER);
    setErrors({});
  };

  return (
    <Stack gap="sm">
      <TextField
        label="Name"
        value={values.name}
        onChangeText={(value) => setValue('name', value)}
        error={errors.name}
        placeholder="Who is part of your day?"
        maxLength={80}
      />
      {choices('Role', PARTY_ROLES, 'role')}
      {choices('Connected to', PARTY_SIDES, 'side')}
      <TextField
        label="Email (optional)"
        value={values.email}
        onChangeText={(value) => setValue('email', value)}
        error={errors.email}
        placeholder="name@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextField
        label="Phone (optional)"
        value={values.phone}
        onChangeText={(value) => setValue('phone', value)}
        placeholder="Phone number"
        keyboardType="phone-pad"
      />
      <TextField
        label="Notes"
        value={values.note}
        onChangeText={(value) => setValue('note', value)}
        error={errors.note}
        placeholder="A helpful detail or responsibility…"
        multiline
        numberOfLines={2}
        maxLength={300}
      />
      <Button label="Add person" iconLeft="plus" size="sm" onPress={save} />
      <Text variant="caption" color="subtle">
        Contact details are stored in this wedding workspace on this device.
      </Text>
    </Stack>
  );
}

export default PartyMemberForm;
