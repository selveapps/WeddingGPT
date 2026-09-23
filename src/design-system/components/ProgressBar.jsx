import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme, useMotion } from '../theme';
import Text from './Text';

/**
 * ProgressBar - animated linear progress.
 *
 * Used for planning completion, budget consumption and RSVP response rates.
 * The fill animates on change because the PRD asks for budget values to move
 * rather than jump (s.17); `useMotion` makes that instant under Reduce Motion.
 *
 * `segments` supports the budget case, where one track carries both spent and
 * committed amounts stacked in a single bar.
 */
export function ProgressBar({
  /** 0-1. Ignored when `segments` is provided. */
  value = 0,
  /** [{ value: 0-1, color: themeRole }] rendered left to right. */
  segments,
  height = 8,
  tone = 'brand',
  /** Renders "8 of 24" style text above the bar. */
  label,
  valueLabel,
  style,
  accessibilityLabel,
}) {
  const { colors, radii, spacing } = useTheme();

  const clamp = (n) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));
  const percent = Math.round(clamp(value) * 100);

  return (
    <View style={[{ gap: spacing.xs }, style]}>
      {(label || valueLabel) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
          {label && (
            <Text variant="label" color="muted" style={{ flex: 1 }} numberOfLines={1}>
              {label}
            </Text>
          )}
          {valueLabel && (
            <Text variant="labelStrong" color="default">
              {valueLabel}
            </Text>
          )}
        </View>
      )}

      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={accessibilityLabel ?? label ?? 'Progress'}
        accessibilityValue={{ min: 0, max: 100, now: percent }}
        style={{
          height,
          borderRadius: radii.pill,
          backgroundColor: colors.trackEmpty,
          overflow: 'hidden',
          flexDirection: 'row',
        }}
      >
        {segments?.length
          ? segments.map((segment, index) => (
              <Fill
                key={segment.key ?? index}
                value={clamp(segment.value)}
                color={colors[segment.color] ?? segment.color ?? colors.brand}
                rounded={false}
              />
            ))
          : <Fill value={clamp(value)} color={colors[tone] ?? colors.brand} rounded />}
      </View>
    </View>
  );
}

/** One animated fill. Split out so each segment owns its own shared value. */
function Fill({ value, color, rounded }) {
  const { radii } = useTheme();
  const motion = useMotion();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withSpring(value, motion.springs.gentle);
  }, [value, width, motion]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <Animated.View
      style={[
        {
          height: '100%',
          backgroundColor: color,
          borderRadius: rounded ? radii.pill : 0,
        },
        animatedStyle,
      ]}
    />
  );
}

export default ProgressBar;
