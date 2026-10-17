import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme, useMotion } from '../theme';
import Touchable from './Touchable';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const CHECK_PATH = 'M5 12.5 10 17.5 19 7';
/** Rough arc length of CHECK_PATH - used to draw the stroke on. */
const CHECK_LENGTH = 26;

/**
 * Checkbox - task completion, RSVP toggles, bulk selection.
 *
 * Completing a task is the most-repeated positive moment in the product, so it
 * gets real treatment (PRD s.17): the box springs, and the tick draws itself on
 * rather than appearing. Under Reduce Motion both land instantly.
 *
 * The haptic is `medium` by design - completing a task is a meaningful action,
 * not a selection.
 */
export function Checkbox({
  checked = false,
  onChange,
  size = 24,
  tone = 'brand',
  disabled = false,
  /** Circular instead of rounded-square - used in task lists. */
  round = true,
  label,
  style,
  testID,
}) {
  const { colors, radii, borderWidths } = useTheme();
  const motion = useMotion();

  const progress = useSharedValue(checked ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (motion.reduceMotion) {
      progress.value = checked ? 1 : 0;
      return;
    }

    progress.value = withTiming(checked ? 1 : 0, { duration: motion.durations.base });
  }, [checked, progress, scale, motion]);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: progress.value > 0.5 ? colors[tone] : 'transparent',
    borderColor: progress.value > 0.5 ? colors[tone] : colors.borderStrong,
  }));

  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LENGTH * (1 - progress.value),
  }));

  return (
    <Touchable
      onPress={() => onChange?.(!checked)}
      disabled={disabled}
      haptic={checked ? 'light' : 'medium'}
      scaleOnPress={false}
      hitSlop={12}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      testID={testID}
      style={style}
    >
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: round ? radii.pill : radii.xs,
            borderWidth: borderWidths.thick,
            alignItems: 'center',
            justifyContent: 'center',
          },
          boxStyle,
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <AnimatedPath
            d={CHECK_PATH}
            stroke={colors.inkOnBrand}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={CHECK_LENGTH}
            animatedProps={checkProps}
          />
        </Svg>
      </Animated.View>
    </Touchable>
  );
}

export default Checkbox;
