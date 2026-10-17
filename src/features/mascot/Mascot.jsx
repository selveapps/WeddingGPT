import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Svg from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useMotion } from '@/design-system/theme';
import { mascotArt, MASCOT_MOODS, MASCOT_VIEWBOX } from './swanArt';
import { renderArt } from './renderArt';

/**
 * The WeddingGPT mascot: a swan couple - the bride with a veil and flower
 * crown, the groom with a top hat and bow tie - whose necks curve together
 * into a heart. They are the face of the app icon and the landing animation,
 * and they guide the couple through onboarding, Home and the Assistant.
 *
 * The drawing lives in `swanArt.js`, shared with the icon export and the
 * landing, so it is the same pair everywhere.
 *
 * Moods: `happy` (default), `wave`, `think`, `celebrate`.
 *
 * Motion is a slow float and an occasional blink, and both switch off with
 * Reduce Motion (or `still`), leaving a static drawing.
 */
export function Mascot({ size = 64, mood = 'happy', still = false, style }) {
  const motion = useMotion();
  const animate = !still && !motion.reduceMotion;
  const face = MASCOT_MOODS.includes(mood) ? mood : 'happy';

  const float = useSharedValue(0);
  const blink = useSharedValue(1);

  useEffect(() => {
    if (!animate) {
      float.value = 0;
      blink.value = 1;
      return undefined;
    }
    float.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    blink.value = withRepeat(
      withSequence(
        withDelay(3200, withTiming(0.1, { duration: 90 })),
        withTiming(1, { duration: 110 })
      ),
      -1,
      false
    );
    return () => {
      cancelAnimation(float);
      cancelAnimation(blink);
    };
  }, [animate, float, blink]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -3 * float.value * (size / 64) }],
  }));

  const art = useMemo(() => mascotArt(face), [face]);

  return (
    <View
      style={[{ width: size, height: size }, style]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={floatStyle}>
        <Svg width={size} height={size} viewBox={MASCOT_VIEWBOX}>
          {renderArt(art, blink, 'mascot')}
        </Svg>
      </Animated.View>
    </View>
  );
}

export default Mascot;
