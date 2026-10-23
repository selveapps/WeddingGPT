import React, { useState } from 'react';
import { Button, Chip, Row, Stack, Text, TextField } from '@/design-system/components';
import { MENU_STATUSES, normaliseMenuItem, validateMenuItem } from '../lib/menuHelpers';

const EMPTY = { dish: '', course: '', dietary: '', serving: '', status: 'planned' };
const LABELS = { planned: 'Planned', confirmed: 'Confirmed', served: 'Served' };

export function MenuItemForm({ initialValue, onSave, onCancel }) {
  const [values, setValues] = useState(() => ({ ...EMPTY, ...initialValue }));
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => setValues((current) => ({ ...current, [key]: value }));
  const save = () => {
    const result = validateMenuItem(values);
    setErrors(result.errors);
    if (result.isValid && onSave(normaliseMenuItem(values))) setValues(EMPTY);
  };
  return (
    <Stack gap="sm" testID="menu-item-form">
      <TextField
        label="Dish or menu item"
        value={values.dish}
        onChangeText={set('dish')}
        error={errors.dish}
        maxLength={90}
        placeholder="e.g. Wild mushroom risotto"
      />
      <TextField
        label="Course"
        value={values.course}
        onChangeText={set('course')}
        error={errors.course}
        maxLength={40}
        placeholder="Starter, main, dessert…"
      />
      <TextField
        label="Dietary / allergen notes"
        value={values.dietary}
        onChangeText={set('dietary')}
        error={errors.dietary}
        maxLength={180}
        placeholder="Vegetarian, contains nuts…"
      />
      <TextField
        label="Serving preference"
        value={values.serving}
        onChangeText={set('serving')}
        error={errors.serving}
        maxLength={180}
        placeholder="Plated, family-style, child portion…"
      />
      <Text variant="label">Status</Text>
      <Row gap="xs" wrap>
        {MENU_STATUSES.map((status) => (
          <Chip
            key={status}
            label={LABELS[status]}
            selected={values.status === status}
            onPress={() => set('status')(status)}
            testID={`menu-status-${status}`}
          />
        ))}
      </Row>
      {errors.status ? (
        <Text variant="caption" color="danger">
          {errors.status}
        </Text>
      ) : null}
      <Row gap="sm">
        <Button
          label={initialValue ? 'Save changes' : 'Add menu item'}
          size="sm"
          onPress={save}
          testID="menu-save"
        />
        {onCancel ? <Button label="Cancel" variant="ghost" size="sm" onPress={onCancel} /> : null}
      </Row>
    </Stack>
  );
}

export default MenuItemForm;
