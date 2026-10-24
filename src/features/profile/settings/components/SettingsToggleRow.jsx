/**
 * SettingsToggleRow — label + description + switch, used across all sections.
 */

import React from 'react';
import { View, Switch, StyleSheet } from 'react-native';

import { Text } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

export function SettingsToggleRow({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  testID,
}) {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          paddingVertical: spacing.sm,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: Boolean(value), disabled }}
      accessibilityLabel={label}
      accessibilityHint={description}
    >
      <View style={styles.text}>
        <Text variant="body" color="ink">
          {label}
        </Text>
        {description ? (
          <Text variant="caption" color="muted">
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={Boolean(value)}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.brand }}
        thumbColor={colors.canvas}
        testID={testID ? `${testID}-switch` : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 52,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});

export default SettingsToggleRow;
