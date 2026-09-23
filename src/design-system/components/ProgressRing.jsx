import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme, useMotion } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * ProgressRing - circular progress with an animated sweep.
 *
 * Carries the overall planning-progress figure on Home and the per-category
 * rings in Planning. The sweep is driven by `strokeDashoffset` on a single
 * circle, which keeps it to one animated node rather than an arc path that
 * would have to be recomputed on the JS thread every frame.
 *
 * Children render in the middle, so callers can drop a percentage or a count
 * inside without a second absolute-positioned wrapper.
 */
export function ProgressRing({
  /** 0-1 */
  value = 0,
  size = 96,
  thickness = 8,
  tone = 'brand',
  trackTone = 'trackEmpty',
  children,
  style,
  accessibilityLabel,
}) {
  const { colors } = useTheme();
  const motion = useMotion();

  const clamped = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(clamped, motion.springs.gentle);
  }, [clamped, progress, motion]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? 'Progress'}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors[trackTone] ?? colors.trackEmpty}
          strokeWidth={thickness}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors[tone] ?? colors.brand}
          strokeWidth={thickness}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          // Start the sweep at 12 o'clock instead of 3 o'clock.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

export default ProgressRing;
