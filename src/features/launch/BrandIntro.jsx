import React, { useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import haptics from '@/lib/haptics';
import { useTheme, useMotion } from '@/design-system/theme';
import { Text, Row } from '@/design-system/components';
import { FloatingHearts } from './FloatingHearts';
import { WeddingSwans } from './WeddingSwans';

/**
 * BrandIntro - the brief brand moment on launch (PRD s.3.1).
 *
 * A short, choreographed hello, about two and a half seconds end to end:
 *
 *   1. Two graceful swans glide in from either side over a soft halo and
 *      lean in until their long necks make a heart, and a little heart pops
 *      up inside it (see `WeddingSwans`).
 *   2. They bob gently on the water.
 *   3. "Wedding", then "GPT", then the tagline rise into place.
 *   4. Hearts drift up behind everything.
 *   5. The whole scene fades and lifts slightly as it hands over.
 *
 * Haptics follow the choreography: a heartbeat as the swans meet (see
 * `WeddingSwans`), a soft tick as each word lands, and a gentle tap on the
 * handover. A tap to skip gets its own tap and silences anything still queued.
 *
 * It is a greeting, not a gate: a tap anywhere skips it. With Reduce Motion on
 * everything appears at once, nothing loops, and it hands over after a short,
 * still beat with a single light tap.
 */

const EXIT_AT_MS = 2900;
const EXIT_MS = 320;
const REDUCED_HOLD_MS = 700;

const easeOut = Easing.out(Easing.cubic);

export function BrandIntro({ onFinish, footer }) {
  const { colors, spacing } = useTheme();
  const { reduceMotion } = useMotion();
  const still = reduceMotion;

  const halo = useSharedValue(still ? 1 : 0);
  const words = useSharedValue(still ? 1 : 0);
  const gpt = useSharedValue(still ? 1 : 0);
  const tagline = useSharedValue(still ? 1 : 0);
  const exit = useSharedValue(0);

  // onFinish must fire exactly once, whether the timer or a tap gets there first.
  const finished = useRef(false);
  const finish = (skipped) => {
    if (finished.current) return;
    finished.current = true;
    if (skipped) haptics.light();
    onFinish?.({ skipped });
  };

  useEffect(() => {
    if (still) {
      haptics.light();
      const timer = setTimeout(() => finish(false), REDUCED_HOLD_MS);
      return () => clearTimeout(timer);
    }

    // Ticks land with each word; once skipped, anything still queued stays quiet.
    const tick = (fn) => () => {
      if (!finished.current) fn();
    };

    halo.value = withTiming(1, { duration: 700, easing: easeOut });
    words.value = withDelay(1250, withTiming(1, { duration: 520, easing: easeOut }));
    gpt.value = withDelay(1430, withTiming(1, { duration: 520, easing: easeOut }));
    tagline.value = withDelay(1700, withTiming(1, { duration: 520, easing: easeOut }));
    exit.value = withDelay(EXIT_AT_MS, withTiming(1, { duration: EXIT_MS, easing: Easing.in(Easing.quad) }));

    const timers = [
      setTimeout(tick(haptics.selection), 1250),
      setTimeout(tick(haptics.selection), 1430),
      setTimeout(tick(haptics.selection), 1700),
      setTimeout(tick(haptics.light), EXIT_AT_MS),
      setTimeout(() => finish(false), EXIT_AT_MS + EXIT_MS),
    ];
    return () => timers.forEach(clearTimeout);
    // Runs once per mount: the intro is a single performance, not a reactive view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sceneStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ translateY: -12 * exit.value }, { scale: 1 + 0.03 * exit.value }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: halo.value,
    transform: [{ scale: interpolate(halo.value, [0, 1], [0.4, 1]) }],
  }));

  const haloSize = 190;
  const stageSize = 250;

  return (
    <Pressable
      style={styles.fill}
      onPress={() => finish(true)}
      accessible
      accessibilityRole="header"
      accessibilityLabel="WeddingGPT. Your wedding, thoughtfully planned."
      accessibilityHint="Tap to continue"
    >
      <Animated.View style={[styles.fill, sceneStyle]}>
        <FloatingHearts count={14} opacity={0.45} />

        <View style={[styles.center, { gap: spacing.xl }]}>
          {/* --- Mark ------------------------------------------------------- */}
          <View style={{ width: stageSize, height: stageSize, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View
              style={[
                styles.halo,
                { width: haloSize, height: haloSize, borderRadius: haloSize, backgroundColor: colors.brandSoft },
                haloStyle,
              ]}
            />

            <WeddingSwans still={still} size={stageSize} />
          </View>

          {/* --- Wordmark ---------------------------------------------------- */}
          <View style={{ alignItems: 'center', gap: spacing.xs }}>
            <Row gap="none" align="baseline">
              <Rise value={words}>
                <Text variant="displayAccent" color="ink">
                  Wedding
                </Text>
              </Rise>
              <Rise value={gpt}>
                <Text variant="displayMd" color="brand">
                  GPT
                </Text>
              </Rise>
            </Row>
            <Rise value={tagline}>
              <Text variant="eyebrow" color="muted" align="center">
                Your wedding, thoughtfully planned
              </Text>
            </Rise>
          </View>
        </View>
      </Animated.View>

      {/* Outside the fading scene, so a slow load still shows its message. */}
      {footer ? (
        <View pointerEvents="none" style={[styles.footer, { paddingHorizontal: spacing.lg }]}>
          {footer}
        </View>
      ) : null}
    </Pressable>
  );
}

/** Fades its child in while lifting it into place, driven by `value` (0-1). */
function Rise({ value, children }) {
  const animated = useAnimatedStyle(() => ({
    opacity: value.value,
    transform: [{ translateY: interpolate(value.value, [0, 1], [16, 0]) }],
  }));
  return <Animated.View style={animated}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: '18%', alignItems: 'center' },
});

export default BrandIntro;
