/**
 * SettingsChoice — single-select list of options (theme, density, AI style…).
 * Mirrors PreferenceChoice from profile but tuned for settings density.
 */

import React, { useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';

import { Stack, Text, Card } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

export function SettingsChoice({
  label,
  description,
  options = [],
  value,
  onChange,
  testID,
  disabled = false,
}) {
  const { colors, radii, spacing } = useTheme();

  const handlePress = useCallback(
    (next) => {
      if (disabled) return;
      if (next === value) return;
      onChange?.(next);
    },
    [disabled, onChange, value]
  );

  return (
    <Stack gap="xs" testID={testID}>
      {label ? (
        <Text variant="label" color="ink">
          {label}
        </Text>
      ) : null}
      {description ? (
        <Text variant="caption" color="muted">
          {description}
        </Text>
      ) : null}
      <Card padding="none" radius="lg">
        {options.map((opt, index) => {
          const selected = opt.value === value;
          const isLast = index === options.length - 1;
          return (
            <Pressable
              key={String(opt.value)}
              onPress={() => handlePress(opt.value)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              testID={testID ? `${testID}-${opt.value}` : undefined}
              style={({ pressed }) => [
                styles.row,
                {
                  borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                  borderBottomColor: colors.borderSubtle,
                  backgroundColor: pressed
                    ? colors.surfaceSunken
                    : selected
                      ? colors.brandSoft
                      : 'transparent',
                  opacity: disabled ? 0.5 : 1,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm + 2,
                },
              ]}
            >
              <View style={styles.textCol}>
                <Text
                  variant="body"
                  color={selected ? 'brandSoftInk' : 'ink'}
                  style={{ fontWeight: selected ? '600' : '400' }}
                >
                  {opt.label}
                </Text>
                {opt.description ? (
                  <Text variant="caption" color="muted">
                    {opt.description}
                  </Text>
                ) : null}
              </View>
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: selected ? colors.brand : colors.border,
                    backgroundColor: selected ? colors.brand : 'transparent',
                    borderRadius: radii.full ?? 999,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </Card>
    </Stack>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  textCol: {
    flex: 1,
    paddingRight: 12,
    gap: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderWidth: 2,
  },
});

export default SettingsChoice;
