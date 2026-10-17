import React, { useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
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
 * the finger barely travelled, which is how these are expected to behave. It
 * is attached to the handle and header only, so it never fights the body's
 * own scrolling.
 *
 * Layout is fixed here rather than per sheet: the same gutter as screens, a
 * clear gap between header, body and footer, a body that scrolls when content
 * is taller than the sheet, and lift above the keyboard for sheets with fields.
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
  const { colors, spacing, radii, shadows, layout } = useTheme();
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

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
          pointerEvents="box-none"
        >
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
                paddingBottom: insets.bottom + spacing.lg,
              },
              sheetStyle,
            ]}
          >
            <GestureDetector gesture={panGesture}>
              <View>
                {showHandle ? (
                  <View style={[styles.handleArea, { paddingTop: spacing.sm, paddingBottom: spacing.xs }]}>
                    <View
                      style={{
                        width: 36,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: colors.borderStrong,
                      }}
                    />
                  </View>
                ) : null}

                {title || dismissible ? (
                  <View
                    style={[
                      styles.header,
                      {
                        paddingHorizontal: layout.gutter,
                        paddingTop: showHandle ? spacing.xs : spacing.xl,
                        paddingBottom: spacing.lg,
                        gap: spacing.md,
                      },
                    ]}
                  >
                    <View style={{ flex: 1, gap: spacing.xxs }}>
                      {title ? (
                        <Text variant="h2" heading>
                          {title}
                        </Text>
                      ) : null}
                      {subtitle ? (
                        <Text variant="bodySm" color="muted">
                          {subtitle}
                        </Text>
                      ) : null}
                    </View>

                    {dismissible ? (
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
                    ) : null}
                  </View>
                ) : null}
              </View>
            </GestureDetector>

            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ paddingHorizontal: layout.gutter }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {children}
            </ScrollView>

            {footer ? (
              <View style={{ paddingHorizontal: layout.gutter, paddingTop: spacing.lg }}>{footer}</View>
            ) : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboard: {
    width: '100%',
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
