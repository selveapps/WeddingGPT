import React, { useCallback, useEffect } from 'react';
import { Modal, View, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

import { useTheme, useMotion } from '../theme';
import Text from './Text';
import Icon from './Icon';
import Touchable from './Touchable';

/**
 * BottomSheet - the app's standard modal surface.
 *
 * Used for task detail, add-expense, RSVP editing, AI prompt entry and every
 * AI confirmation preview. Built on RN's `Modal` so it sits above the tab bar
 * and inherits correct back-button handling on Android.
 *
 * Drag-to-dismiss is a `Gesture.Pan` that only tracks downward movement and
 * commits on either distance or velocity - so a quick flick closes it even if
 * the finger barely travelled, which is how these are expected to behave.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  /** Node docked at the bottom, outside the scroll area. */
  footer,
  /** Blocks backdrop tap and drag-to-dismiss - for destructive confirmations. */
  dismissible = true,
  /** Fraction of screen height the sheet may occupy. */
  maxHeightRatio = 0.9,
  showHandle = true,
  testID,
}) {
  const { colors, spacing, radii, shadows } = useTheme();
  const motion = useMotion();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const translateY = useSharedValue(screenHeight);

  const close = useCallback(() => {
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      translateY.value = motion.reduceMotion
        ? 0
        : withSpring(0, motion.springs.sheet);
    } else {
      translateY.value = motion.reduceMotion
        ? screenHeight
        : withTiming(screenHeight, { duration: motion.durations.base });
    }
  }, [visible, translateY, motion, screenHeight]);

  const panGesture = Gesture.Pan()
    .enabled(dismissible)
    .onUpdate((event) => {
      // Only follow downward drags; resist upward pull entirely.
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      const shouldClose = event.translationY > 120 || event.velocityY > 900;
      if (shouldClose) {
        translateY.value = withTiming(screenHeight, { duration: 180 }, () => {
          runOnJS(close)();
        });
      } else {
        translateY.value = withSpring(0, motion.springs.sheet);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, screenHeight * 0.5],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismissible ? close : undefined}
      testID={testID}
    >
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Touchable
            onPress={dismissible ? close : undefined}
            disabled={!dismissible}
            haptic={null}
            scaleOnPress={false}
            hitSlop={0}
            accessibilityLabel="Close"
            accessibilityRole="button"
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
          >
            <View />
          </Touchable>
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              shadows.xl,
              {
                maxHeight: screenHeight * maxHeightRatio,
                backgroundColor: colors.surface,
                borderTopLeftRadius: radii.xxl,
                borderTopRightRadius: radii.xxl,
                paddingBottom: insets.bottom + spacing.md,
              },
              sheetStyle,
            ]}
          >
            {showHandle && (
              <View style={[styles.handleArea, { paddingVertical: spacing.sm }]}>
                <View
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.borderStrong,
                  }}
                />
              </View>
            )}

            {(title || dismissible) && (
              <View
                style={[
                  styles.header,
                  { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.md },
                ]}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  {title && (
                    <Text variant="h2" heading>
                      {title}
                    </Text>
                  )}
                  {subtitle && (
                    <Text variant="bodySm" color="muted">
                      {subtitle}
                    </Text>
                  )}
                </View>

                {dismissible && (
                  <Touchable
                    onPress={close}
                    haptic="light"
                    scaleOnPress={false}
                    hitSlop={12}
                    accessibilityLabel="Close"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: radii.pill,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.surfaceSunken,
                    }}
                  >
                    <Icon name="close" size="sm" color="inkMuted" />
                  </Touchable>
                )}
              </View>
            )}

            <View style={{ paddingHorizontal: spacing.lg, flexShrink: 1 }}>{children}</View>

            {footer && (
              <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
                {footer}
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
  },
  handleArea: {
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});

export default BottomSheet;
