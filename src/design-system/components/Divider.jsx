import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme';
import Text from './Text';
import { decorative } from './a11y';

/**
 * Divider - a hairline rule, optionally with a centred label.
 *
 * Hidden from screen readers: a rule is a visual convenience and announcing it
 * only adds noise to the reading order.
 */
export function Divider({ label, inset = 0, spacing: gap = 'md', style }) {
  const { colors, spacing, borderWidths } = useTheme();
  const verticalGap = typeof gap === 'number' ? gap : spacing[gap] ?? spacing.md;

  const line = (
    <View
      style={{
        flex: label ? 1 : undefined,
        height: borderWidths.hairline,
        backgroundColor: colors.border,
      }}
    />
  );

  if (!label) {
    return (
      <View
        {...decorative}
        style={[{ marginVertical: verticalGap, marginHorizontal: inset }, style]}
      >
        {line}
      </View>
    );
  }

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginVertical: verticalGap,
          marginHorizontal: inset,
        },
        style,
      ]}
    >
      {line}
      <Text variant="caption" color="subtle">
        {label}
      </Text>
      {line}
    </View>
  );
}

export default Divider;
