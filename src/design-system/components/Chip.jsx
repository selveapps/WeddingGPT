import React from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme } from '../theme';
import Touchable from './Touchable';
import Text from './Text';
import Icon from './Icon';

/**
 * Chip - a compact, selectable token.
 *
 * Used for onboarding multi-selects, task filters, guest tags and AI context
 * chips. Selection is always driven by the parent (`selected` + `onPress`), so
 * a chip never owns state and single/multi-select behaviour lives with whoever
 * understands the rules.
 *
 * Accessibility: reports as a checkbox when selectable so screen readers
 * announce the selected state, rather than a button that says nothing useful.
 */
export function Chip({
  label,
  selected = false,
  onPress,
  onRemove,
  icon,
  size = 'md',
  tone = 'neutral',
  disabled = false,
  style,
  testID,
}) {
  const { colors, spacing, radii, borderWidths } = useTheme();

  const compact = size === 'sm';
  const selectable = Boolean(onPress);

  const toneColors = {
    neutral: { bg: colors.brandSoft, ink: colors.brandSoftInk, border: colors.brand },
    accent: { bg: colors.accentSoft, ink: colors.accentSoftInk, border: colors.accent },
    success: { bg: colors.successSoft, ink: colors.successSoftInk, border: colors.success },
    warning: { bg: colors.warningSoft, ink: colors.warningSoftInk, border: colors.warning },
    danger: { bg: colors.dangerSoft, ink: colors.dangerSoftInk, border: colors.danger },
  }[tone] ?? {};

  const container = selected
    ? { backgroundColor: toneColors.bg, borderColor: toneColors.border }
    : { backgroundColor: colors.surface, borderColor: colors.border };

  const inkColor = selected ? toneColors.ink : colors.inkMuted;

  const content = (
    <View style={[styles.row, { gap: compact ? spacing.hair : spacing.xxs }]}>
      {icon && <Icon name={icon} size={compact ? 'xs' : 'sm'} color={inkColor} />}
      <Text variant={compact ? 'caption' : 'labelStrong'} style={{ color: inkColor }} numberOfLines={1}>
        {label}
      </Text>
      {onRemove && (
        <Touchable
          onPress={onRemove}
          haptic="light"
          hitSlop={10}
          accessibilityLabel={`Remove ${label}`}
          scaleOnPress={false}
        >
          <Icon name="close" size="xs" color={inkColor} />
        </Touchable>
      )}
    </View>
  );

  const containerStyle = [
    styles.base,
    {
      paddingVertical: compact ? spacing.hair + 2 : spacing.xs,
      paddingHorizontal: compact ? spacing.xs : spacing.sm,
      borderRadius: radii.pill,
      borderWidth: borderWidths.thin,
    },
    container,
    style,
  ];

  if (!selectable) {
    return (
      <View style={containerStyle} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Touchable
      onPress={onPress}
      disabled={disabled}
      haptic="selection"
      style={containerStyle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={label}
      testID={testID}
    >
      {content}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default Chip;
