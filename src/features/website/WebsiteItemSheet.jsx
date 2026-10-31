import React, { useState } from 'react';

import { BottomSheet, Button, Stack, TextField } from '@/design-system/components';
import { WebsiteSection, validateWebsiteItem } from '@/models';
import { DateField } from '@/features/shared/DateField';

/** The fields each list section edits, in order. */
export const SECTION_FIELDS = {
  [WebsiteSection.EVENTS]: [
    { key: 'name', label: 'What', placeholder: 'Ceremony' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'time', label: 'Time', placeholder: '3:00 pm' },
    { key: 'place', label: 'Place', placeholder: 'The Rose Garden' },
    {
      key: 'address',
      label: 'Address',
      placeholder: 'For directions',
      helper: 'Guests get a map link to it.',
    },
    { key: 'notes', label: 'Notes', multiline: true, placeholder: 'Dress code, parking, timings' },
  ],
  [WebsiteSection.STAYS]: [
    { key: 'name', label: 'Hotel or stay', placeholder: 'Hotel Ella' },
    { key: 'url', label: 'Link', placeholder: 'https://', url: true },
    { key: 'notes', label: 'Notes', multiline: true, placeholder: 'Group rate code, how far it is' },
  ],
  [WebsiteSection.REGISTRY]: [
    { key: 'name', label: 'Registry', placeholder: 'Our registry' },
    { key: 'url', label: 'Link', placeholder: 'https://', url: true },
  ],
  [WebsiteSection.FAQ]: [
    { key: 'question', label: 'Question', placeholder: 'Can I bring my kids?' },
    { key: 'answer', label: 'Answer', multiline: true },
  ],
};

export const SECTION_TITLES = {
  [WebsiteSection.EVENTS]: 'Schedule item',
  [WebsiteSection.STAYS]: 'Place to stay',
  [WebsiteSection.REGISTRY]: 'Registry link',
  [WebsiteSection.FAQ]: 'Question',
};

/**
 * Add or edit one item of a website section. The screen gives it a new `key`
 * for each item, so it starts from that item's values every time.
 */
export function WebsiteItemSheet({ section, item, visible, onClose, onSave, onDelete }) {
  const [values, setValues] = useState(item ?? {});
  const [errors, setErrors] = useState({});


  if (!section) return null;

  const save = () => {
    const trimmed = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
    );
    const found = validateWebsiteItem(section, trimmed);
    setErrors(found);
    if (Object.keys(found).length) return;
    onSave(trimmed);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={`${item?.id ? 'Edit' : 'Add'} ${SECTION_TITLES[section].toLowerCase()}`}
      footer={<Button label="Save" onPress={save} />}
    >
      <Stack gap="md">
        {SECTION_FIELDS[section].map((field) =>
          field.type === 'date' ? (
            <DateField
              key={field.key}
              label={field.label}
              value={values[field.key] ?? null}
              onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))}
            />
          ) : (
            <TextField
              key={field.key}
              label={field.label}
              value={values[field.key] ?? ''}
              onChangeText={(value) => setValues((current) => ({ ...current, [field.key]: value }))}
              placeholder={field.placeholder}
              helper={field.helper}
              error={errors[field.key]}
              multiline={field.multiline}
              numberOfLines={field.multiline ? 4 : undefined}
              autoCapitalize={field.url ? 'none' : 'sentences'}
              autoCorrect={!field.url}
              keyboardType={field.url ? 'url' : 'default'}
            />
          )
        )}
        {item?.id && onDelete ? (
          <Button label="Remove" variant="ghost" iconLeft="trash" onPress={onDelete} />
        ) : null}
      </Stack>
    </BottomSheet>
  );
}

export default WebsiteItemSheet;
