import React, { useCallback } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useMotion } from '../theme';
import haptics from '../../lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * The press primitive every tappable surface in the app is built on.
 *
 * It exists so three things are impossible to get wrong or forget:
 *  1. Consistent press feedback (a quick opacity dip, no scaling) instead of
 *     each screen inventing its own.
 *  2. Haptics declared by intent - `haptic="selection"` - rather than scattered
 *     `impactAsync` calls with inconsistent weights.
 *  3. A 44pt minimum touch target via `hitSlop`, even when the visual is smaller.
 *
 * Disabled and loading both block the press, but only `disabled` dims the
 * content: a loading button should keep its weight on the screen.
 */
export function Touchable({
  children,
  onPress,
  onLongPress,
  disabled = false,
  loading = false,
  /** One of the named intents on the haptics module, or null to stay silent. */
  haptic = 'light',
  /** Set false for large surfaces (cards) where a scale would look wobbly. */
  scaleOnPress = true,
  hitSlop = 8,
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
  ...rest
}) {
  const motion = useMotion();
  const pressed = useSharedValue(0);

  const blocked = disabled || loading;

  const handlePressIn = useCallback(() => {
    pressed.value = withTiming(1, { duration: motion.durations.fast });
  }, [pressed, motion]);

  const handlePressOut = useCallback(() => {
    pressed.value = withTiming(0, { duration: motion.durations.fast });
  }, [pressed, motion]);

  const handlePress = useCallback(
    (event) => {
      if (blocked) return;
      if (haptic && haptics[haptic]) haptics[haptic]();
      onPress?.(event);
    },
    [blocked, haptic, onPress]
  );

  const targetScale = scaleOnPress ? motion.pressScale : 1;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - targetScale) }],
    opacity: 1 - pressed.value * (1 - motion.pressOpacity),
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      onLongPress={blocked ? undefined : onLongPress}
      onPressIn={blocked ? undefined : handlePressIn}
      onPressOut={blocked ? undefined : handlePressOut}
      disabled={blocked}
      hitSlop={hitSlop}
      style={[style, animatedStyle, disabled && { opacity: 0.45 }]}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: blocked, busy: loading, ...accessibilityState }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

export default Touchable;
