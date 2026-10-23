import React, { useState } from 'react';
import { Button, Chip, Row, Stack, Text, TextField } from '@/design-system/components';
import { normalizeRegistryItem, REGISTRY_STATUSES, validateRegistryItem } from '../lib/registryHelpers';

const EMPTY = { store: '', item: '', price: '', url: '', status: 'listed' };
const LABELS = { listed: 'Listed', reserved: 'Reserved', received: 'Received', thanked: 'Thank-you sent' };

export function RegistryForm({ initialValues = EMPTY, onSave, onCancel, submitLabel = 'Add registry gift' }) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues, price: initialValues.price ?? '' });
  const [errors, setErrors] = useState({});
  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const save = () => {
    const result = validateRegistryItem(values);
    setErrors(result.errors);
    if (result.isValid && onSave(normalizeRegistryItem(values))) setValues(EMPTY);
  };
  return (
    <Stack gap="sm" testID="registry-form">
      <Row gap="sm">
        <TextField
          label="Store"
          value={values.store}
          onChangeText={(v) => set('store', v)}
          error={errors.store}
          placeholder="Shop or registry"
          maxLength={100}
          testID="registry-store"
        />
        <TextField
          label="Item"
          value={values.item}
          onChangeText={(v) => set('item', v)}
          error={errors.item}
          placeholder="What’s on your list?"
          maxLength={120}
          testID="registry-item"
        />
      </Row>
      <TextField
        label="Price (optional)"
        value={String(values.price)}
        onChangeText={(v) => set('price', v)}
        error={errors.price}
        placeholder="0.00"
        keyboardType="decimal-pad"
        prefix="$"
        testID="registry-price"
      />
      <TextField
        label="Item URL (optional)"
        value={values.url}
        onChangeText={(v) => set('url', v)}
        error={errors.url}
        placeholder="https://…"
        keyboardType="url"
        autoCapitalize="none"
        maxLength={500}
        testID="registry-url"
      />
      <Stack gap="xs">
        <Text variant="label">Gift progress</Text>
        <Row gap="xs" wrap>
          {REGISTRY_STATUSES.map((status) => (
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
        <Button label={submitLabel} iconLeft="plus" size="sm" onPress={save} testID="registry-save" />
        {onCancel ? <Button label="Cancel" variant="ghost" size="sm" onPress={onCancel} /> : null}
      </Row>
    </Stack>
  );
}

export default RegistryForm;
