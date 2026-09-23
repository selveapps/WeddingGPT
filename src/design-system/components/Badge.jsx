import React from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme } from '../theme';
import Text from './Text';
import Icon from './Icon';

/**
 * Badge - a small, non-interactive status marker.
 *
 * Distinct from Chip on purpose: a Chip is something you press, a Badge is
 * something you read. RSVP status, payment status, vendor booking state and
 * overdue markers all use this, so status colour stays consistent everywhere.
 */

const TONE_ROLES = {
  neutral: { bg: 'surfaceSunken', ink: 'inkMuted' },
  brand: { bg: 'brandSoft', ink: 'brandSoftInk' },
  accent: { bg: 'accentSoft', ink: 'accentSoftInk' },
  success: { bg: 'successSoft', ink: 'successSoftInk' },
  warning: { bg: 'warningSoft', ink: 'warningSoftInk' },
  danger: { bg: 'dangerSoft', ink: 'dangerSoftInk' },
  info: { bg: 'infoSoft', ink: 'infoSoftInk' },
};

export function Badge({ label, tone = 'neutral', icon, dot = false, style, testID }) {
  const { colors, spacing, radii } = useTheme();
  const roles = TONE_ROLES[tone] ?? TONE_ROLES.neutral;

  const background = colors[roles.bg];
  const ink = colors[roles.ink];

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: background,
          borderRadius: radii.pill,
          paddingVertical: spacing.hair,
          paddingHorizontal: spacing.xs,
          gap: spacing.hair + 2,
        },
        style,
      ]}
      testID={testID}
      // Read as one phrase rather than announcing the dot and label separately.
      accessible
      accessibilityLabel={label}
    >
      {dot && (
        <View
          style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ink }}
        />
      )}
      {icon && <Icon name={icon} size="xs" color={ink} />}
      <Text variant="caption" style={{ color: ink }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
});

export default Badge;
