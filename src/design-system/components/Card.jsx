import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme';
import Touchable from './Touchable';

/**
 * Card - the primary surface for grouping related content.
 *
 * Tone controls how much the card asserts itself:
 *  plain     - flat surface, hairline border. The default for list content.
 *  raised    - shadowed. Reserved for the one thing a screen most wants read.
 *  sunken    - recessed. For nested groupings inside another card.
 *  brand     - tinted. Used by the Next Best Action and AI entry points.
 *  outline   - border only, no fill. For empty and placeholder states.
 *
 * Passing `onPress` turns it into a pressable card. Scale feedback is disabled
 * for cards by default: a large surface shrinking looks unstable, so the press
 * reads as an opacity dip instead.
 */
export function Card({
  children,
  tone = 'plain',
  padding = 'md',
  radius = 'lg',
  onPress,
  onLongPress,
  disabled = false,
  haptic = 'light',
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  testID,
  ...rest
}) {
  const { colors, spacing, radii, shadows, borderWidths } = useTheme();

  const toneStyle = {
    plain: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: borderWidths.hairline,
      ...shadows.sm,
    },
    raised: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: borderWidths.hairline,
      ...shadows.md,
    },
    sunken: {
      backgroundColor: colors.surfaceSunken,
      borderColor: 'transparent',
      borderWidth: 0,
    },
    muted: {
      backgroundColor: colors.surfaceMuted,
      borderColor: 'transparent',
      borderWidth: 0,
    },
    brand: {
      backgroundColor: colors.brandSoft,
      borderColor: 'transparent',
      borderWidth: 0,
    },
    accent: {
      backgroundColor: colors.accentSoft,
      borderColor: 'transparent',
      borderWidth: 0,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
      borderWidth: borderWidths.hairline,
      borderStyle: 'dashed',
    },
  }[tone] ?? {};

  const containerStyle = [
    {
      borderRadius: radii[radius] ?? radii.lg,
      padding: typeof padding === 'number' ? padding : spacing[padding] ?? spacing.md,
    },
    toneStyle,
    style,
  ];

  if (onPress || onLongPress) {
    return (
      <Touchable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        haptic={haptic}
        scaleOnPress={false}
        style={containerStyle}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole ?? 'button'}
        testID={testID}
        {...rest}
      >
        {children}
      </Touchable>
    );
  }

  return (
    <View style={containerStyle} testID={testID} {...rest}>
      {children}
    </View>
  );
}

export default Card;
