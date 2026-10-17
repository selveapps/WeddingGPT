import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text, Row } from '@/design-system/components';
import { useTheme, useMotion } from '@/design-system/theme';

/**
 * Three dots that brighten in turn while the assistant is thinking - the AI
 * loading state (PRD s.12). With Reduce Motion on, the dots stay still and the
 * word "Thinking" carries the meaning instead.
 */
function Dot({ index, reduceMotion }) {
  const { colors } = useTheme();
  const lift = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    lift.value = withDelay(
      index * 200,
      withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(0, { duration: 500 })), -1)
    );
  }, [index, lift, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + lift.value * 0.65,
  }));

  return (
    <Animated.View
      style={[{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.brand }, style]}
    />
  );
}

export function TypingIndicator() {
  const { reduceMotion } = useMotion();

  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel="WeddingGPT is thinking">
      <Row gap="xxs" style={{ height: 22 }}>
        {[0, 1, 2].map((i) => (
          <Dot key={i} index={i} reduceMotion={reduceMotion} />
        ))}
        {reduceMotion ? (
          <Text variant="bodySm" color="muted" style={{ marginLeft: 6 }}>
            Thinking
          </Text>
        ) : null}
      </Row>
    </View>
  );
}

export default TypingIndicator;
