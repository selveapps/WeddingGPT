import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useMotion } from '../design-system/theme';

/** How far (px) a tab drifts in from the side it was approached from. */
const DRIFT = 14;

/**
 * Lowest opacity a tab starts its entrance at. Deliberately well above 0: the
 * old cross-fade began fully transparent and read as data loading slowly, and
 * an interrupted fade could leave a tab blank. Starting this visible means the
 * content is readable from the first frame and can never be stranded unseen.
 */
const START_OPACITY = 0.55;

/** Duration of the entrance; matches the tab bar's gliding pill. */
export const TAB_SWITCH_DURATION = 260;

/**
 * Wraps one tab's screen and plays a short entrance each time it gains focus:
 * a small drift in the direction of travel (moving right through the bar, the
 * new tab arrives from the right) while it settles to full opacity.
 *
 * The navigator itself still switches scenes instantly (`animation: 'none'`);
 * this only moves the incoming content, so the outgoing tab never lingers and
 * the two never overlap.
 *
 * `lastIndexRef` is shared by every tab so each can tell which side the user
 * came from.
 */
export function TabScene({ route, navigation, lastIndexRef, children }) {
  const motion = useMotion();
  const offset = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    return navigation.addListener('focus', () => {
      const index = navigation.getState().routes.findIndex((r) => r.key === route.key);
      const previous = lastIndexRef.current;
      lastIndexRef.current = index;

      // First focus (app launch) and Reduce Motion: just be there.
      if (previous == null || previous === index || motion.reduceMotion) {
        offset.value = 0;
        opacity.value = 1;
        return;
      }

      // Jump to the start pose, then ease home. Sequenced so the jump always
      // lands before the glide begins, even if a previous entrance is mid-way.
      const config = {
        duration: TAB_SWITCH_DURATION,
        easing: Easing.bezier(...motion.easings.decelerate),
      };
      const jump = { duration: 0 };
      offset.value = withSequence(
        withTiming((index > previous ? 1 : -1) * DRIFT, jump),
        withTiming(0, config)
      );
      opacity.value = withSequence(withTiming(START_OPACITY, jump), withTiming(1, config));
    });
  }, [navigation, route.key, lastIndexRef, motion, offset, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: offset.value }],
  }));

  return <Animated.View style={[styles.fill, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

export default TabScene;
