import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme, useMotion } from '@/design-system/theme';
import { Icon } from '@/design-system/components';

/**
 * FloatingHearts - soft hearts and sparkles drifting up behind a screen.
 *
 * Purely decorative: it ignores touches, is hidden from screen readers, and
 * renders nothing at all under Reduce Motion. Each particle gets its own lane,
 * size, speed and sway, picked once per mount so the field does not reshuffle
 * on re-render.
 */
export function FloatingHearts({ count = 12, opacity = 0.5 }) {
  const { colors } = useTheme();
  const { allowDecorative } = useMotion();
  const { width, height } = useWindowDimensions();

  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        id: index,
        // Spread lanes evenly, then jitter, so hearts never bunch up.
        x: ((index + 0.5) / count) * width + (Math.random() - 0.5) * (width / count),
        size: 10 + Math.round(Math.random() * 14),
        duration: 4200 + Math.random() * 3200,
        delay: Math.random() * 2600,
        sway: 10 + Math.random() * 18,
        spin: (Math.random() - 0.5) * 50,
        icon: index % 4 === 3 ? 'sparkle' : 'heart',
        color: index % 3 === 0 ? colors.accent : colors.brand,
      })),
    [count, width, colors.accent, colors.brand]
  );

  if (!allowDecorative) return null;

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {particles.map((particle) => (
        <Particle key={particle.id} {...particle} height={height} peak={opacity} />
      ))}
    </View>
  );
}

function Particle({ x, size, duration, delay, sway, spin, icon, color, height, peak }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false)
    );
  }, [progress, delay, duration]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: interpolate(p, [0, 0.15, 0.75, 1], [0, peak, peak * 0.8, 0]),
      transform: [
        { translateY: interpolate(p, [0, 1], [height * 0.95, height * 0.15]) },
        { translateX: Math.sin(p * Math.PI * 2) * sway },
        { rotate: `${spin * p}deg` },
        { scale: interpolate(p, [0, 0.2, 1], [0.6, 1, 0.85]) },
      ],
    };
  });

  return (
    <Animated.View style={[{ position: 'absolute', left: x - size / 2, top: 0 }, style]}>
      <Icon name={icon} size={size} color={color} filled={icon === 'heart'} strokeWidth={1.4} />
    </Animated.View>
  );
}

export default FloatingHearts;
