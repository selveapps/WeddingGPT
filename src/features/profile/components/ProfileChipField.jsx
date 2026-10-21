import React, { useMemo } from 'react';

import { Stack, Row, Chip, Text, SectionHeader } from '@/design-system/components';
import {
  isChipOptionSelected,
  toggleChipOption,
} from '../lib/profileChipFieldHelpers';

/**
 * A labelled chip group for single- or multi-select profile fields.
 *
 * Options are `{ value, label, description? }`. Multi-select toggles membership;
 * single-select replaces the current value. Descriptions render as a quiet hint
 * under the chips when the selected option has one - useful for planning stage
 * and ceremony type, where the label alone is not always enough.
 */
export function ProfileChipField({
  eyebrow,
  title,
  subtitle,
  options = [],
  value,
  onChange,
  /** When true, `value` is an array and chips toggle membership. */
  multiple = false,
  size = 'sm',
  helper,
  error,
  testID,
}) {
  const selectedMeta = useMemo(() => {
    if (multiple) return null;
    return options.find((option) => option.value === value) ?? null;
  }, [multiple, options, value]);

  const handlePress = (optionValue) => {
    if (multiple) {
      onChange?.(toggleChipOption(value, optionValue));
      return;
    }
    onChange?.(optionValue);
  };

  return (
    <Stack gap="sm" testID={testID}>
      {title || eyebrow ? (
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      ) : null}

      <Row gap="xs" wrap align="flex-start">
        {options.map((option) => (
          <Chip
            key={String(option.value)}
            label={option.label}
            size={size}
            selected={isChipOptionSelected(value, option.value, multiple)}
            onPress={() => handlePress(option.value)}
          />
        ))}
      </Row>

      {selectedMeta?.description && !error ? (
        <Text variant="bodySm" color="muted">
          {selectedMeta.description}
        </Text>
      ) : null}

      {helper && !error ? (
        <Text variant="caption" color="subtle">
          {helper}
        </Text>
      ) : null}

      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}
    </Stack>
  );
}

export default ProfileChipField;
