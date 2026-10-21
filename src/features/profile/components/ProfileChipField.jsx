import React, { useMemo } from 'react';

import { Stack, Row, Chip, Text, SectionHeader } from '@/design-system/components';
import {
  isChipSelectionLimitReached,
  isChipOptionSelected,
  selectedChipDescriptions,
  toggleChipOption,
} from '../lib/profileChipFieldHelpers';

/**
 * A labelled chip group for single- or multi-select profile fields.
 *
 * Options are `{ value, label, description?, disabled? }`. Multi-select toggles
 * membership; single-select replaces the current value. Descriptions render as
 * a quiet hint under the chips when the selected option has one.
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
  maxSelections,
  onSelectionLimitReached,
  size = 'sm',
  helper,
  error,
  disabled = false,
  testID,
}) {
  const selectedMeta = useMemo(() => {
    if (multiple) return null;
    return options.find((option) => option.value === value) ?? null;
  }, [multiple, options, value]);
  const descriptions = multiple
    ? selectedChipDescriptions(options, value)
    : selectedMeta?.description
      ? [selectedMeta.description]
      : [];

  const handlePress = (optionValue) => {
    if (multiple) {
      if (isChipSelectionLimitReached(value, optionValue, maxSelections)) {
        onSelectionLimitReached?.(maxSelections);
        return;
      }
      onChange?.(toggleChipOption(value, optionValue, maxSelections));
      return;
    }
    onChange?.(optionValue);
  };

  return (
    <Stack gap="sm" testID={testID}>
      {title || eyebrow ? <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} /> : null}

      <Row
        gap="xs"
        wrap
        align="flex-start"
        accessibilityRole="group"
        accessibilityLabel={title ?? eyebrow ?? 'Options'}
      >
        {options.map((option) => (
          <Chip
            key={String(option.value)}
            label={option.label}
            size={size}
            selected={isChipOptionSelected(value, option.value, multiple)}
            disabled={disabled || Boolean(option.disabled)}
            onPress={() => handlePress(option.value)}
            testID={testID ? `${testID}-option-${String(option.value)}` : undefined}
          />
        ))}
      </Row>

      {descriptions.length > 0 && !error ? (
        <Text variant="bodySm" color="muted">
          {descriptions.join(' ')}
        </Text>
      ) : null}

      {helper && !error ? (
        <Text variant="caption" color="subtle">
          {helper}
        </Text>
      ) : null}

      {error ? (
        <Text variant="caption" color="danger" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </Stack>
  );
}

export default ProfileChipField;
