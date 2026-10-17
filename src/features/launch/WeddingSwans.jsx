import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import haptics from '@/lib/haptics';
import { renderArt } from '@/features/mascot/renderArt';
import { sparkle } from '@/features/mascot/swanArt';
import { elegantSwan, elegantWater, elegantHeart, ELEGANT_COLORS, ELEGANT_VIEWBOX } from './elegantSwanArt';

/**
 * WeddingSwans - two graceful swans making a heart, on the landing screen.
 *
 *   1. The pool of water appears.
 *   2. One swan glides in from each side, each leaning slightly away.
 *   3. They lean in together until their beaks almost touch and their long
 *      necks close into a heart (with a soft "heartbeat" haptic).
 *   4. A small heart pops up inside it, a couple of sparkles twinkle, and
 *      the pair bob gently on the water.
 *
 * Each swan is its own layer drawn from `elegantSwanArt`. `still` renders
 * the finished pose with no motion (Reduce Motion).
 */

/** When the beaks meet, in ms from mount. */
export const SWANS_TOUCH_MS = 1150;

const GLIDE_MS = 820;
const LEAN_MS = 320;
/** Degrees each swan leans away while gliding in. */
const LEAN_AWAY = 12;
/** The drawing's coordinate space, and where each swan rotates from (its body). */
const SPACE = 200;
const PIVOT = { x: 62, y: 158 };

export function WeddingSwans({ still = false, size = 210 }) {
  const glide = useSharedValue(still ? 1 : 0);
  const lean = useSharedValue(still ? 1 : 0);
  const ripple = useSharedValue(still ? 1 : 0);
  const pop = useSharedValue(still ? 1 : 0);
  const bob = useSharedValue(0);

  useEffect(() => {
    if (still) return undefined;
    ripple.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    glide.value = withDelay(80, withTiming(1, { duration: GLIDE_MS, easing: Easing.out(Easing.cubic) }));
    lean.value = withDelay(
      SWANS_TOUCH_MS - LEAN_MS,
      withTiming(1, { duration: LEAN_MS, easing: Easing.out(Easing.back(1.6)) })
    );
    pop.value = withDelay(
      SWANS_TOUCH_MS + 60,
      withSequence(
        withTiming(1.15, { duration: 260, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 180, easing: Easing.inOut(Easing.quad) })
      )
    );
    bob.value = withDelay(
      SWANS_TOUCH_MS + 300,
      withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
    // A two-beat "heartbeat" as the necks close, so the moment is felt as
    // well as seen: a firm beat, then a softer echo as the little heart pops.
    const timers = [
      setTimeout(() => haptics.medium(), SWANS_TOUCH_MS),
      setTimeout(() => haptics.light(), SWANS_TOUCH_MS + 150),
    ];
    return () => timers.forEach(clearTimeout);
  }, [still, glide, lean, ripple, pop, bob]);

  const groupStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -3 * bob.value }],
  }));

  const waterStyle = useAnimatedStyle(() => ({
    opacity: ripple.value,
    transform: [{ scaleX: interpolate(ripple.value, [0, 1], [0.6, 1]) }],
  }));

  const heartStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, pop.value * 1.5),
    transform: [{ translateY: interpolate(pop.value, [0, 1], [10, 0]) }, { scale: pop.value }],
  }));

  return (
    <View
      style={{ width: size, height: size }}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[StyleSheet.absoluteFill, waterStyle]}>
        <Layer size={size}>{elegantWater()}</Layer>
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, groupStyle]}>
        <Swan side="bride" size={size} glide={glide} lean={lean} />
        <Swan side="groom" size={size} glide={glide} lean={lean} />

        <Animated.View style={[StyleSheet.absoluteFill, heartStyle]}>
          <Layer size={size}>
            {['g', {}, [
              elegantHeart(100, 98, 10),
              sparkle(78, 22, 4.5, '#F2A93B'),
              sparkle(124, 18, 3.6, ELEGANT_COLORS.heart),
            ]]}
          </Layer>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** One swan, gliding in from its side and then leaning in to meet the other. */
function Swan({ side, size, glide, lean }) {
  const dir = side === 'bride' ? -1 : 1;
  const unit = size / SPACE;
  // Offsets from the layer's centre to the pivot, so rotation happens about the body.
  const px = ((side === 'bride' ? PIVOT.x : SPACE - PIVOT.x) - SPACE / 2) * unit;
  const py = (PIVOT.y - SPACE / 2) * unit;

  const animated = useAnimatedStyle(() => ({
    opacity: interpolate(glide.value, [0, 0.3, 1], [0, 1, 1]),
    transform: [
      { translateX: interpolate(glide.value, [0, 1], [dir * size * 0.75, 0]) },
      { translateX: px },
      { translateY: py },
      { rotate: `${dir * LEAN_AWAY * (1 - lean.value)}deg` },
      { translateX: -px },
      { translateY: -py },
    ],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animated]}>
      <Layer size={size}>{elegantSwan(side === 'bride' ? 'left' : 'right')}</Layer>
    </Animated.View>
  );
}

/** An SVG layer in the swans' 200 space. */
function Layer({ size, children }) {
  return (
    <Svg width={size} height={size} viewBox={ELEGANT_VIEWBOX}>
      {renderArt(children, null, 'layer')}
    </Svg>
  );
}

export default WeddingSwans;
