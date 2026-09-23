import React from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme';

/**
 * Screen - the outer shell every route renders into.
 *
 * Handles the four things that would otherwise be re-solved (and quietly got
 * wrong) on every screen:
 *
 *  1. Safe-area insets, including extra bottom padding so content clears the
 *     tab bar rather than hiding under it.
 *  2. Keyboard avoidance, which the PRD calls for by name in onboarding (s.4.1).
 *  3. Pull-to-refresh with a deliberate loading state (s.17).
 *  4. A max content width, so the layout does not sprawl on tablets.
 *
 * `scroll={false}` gives a fixed, non-scrolling frame - used for chat, quizzes
 * and any screen that manages its own list virtualisation.
 */
export function Screen({
  children,
  scroll = true,
  /** Applies the horizontal page gutter. Turn off for edge-to-edge content. */
  padded = true,
  /** Respect the top inset. Off when a full-bleed image sits under the status bar. */
  safeTop = true,
  safeBottom = true,
  /** Extra bottom room for a tab bar or a docked CTA. */
  bottomInset = 0,
  onRefresh,
  refreshing = false,
  /** Node pinned below the scroll area, e.g. an onboarding Continue button. */
  footer,
  background = 'canvas',
  contentContainerStyle,
  style,
  testID,
  ...rest
}) {
  const { colors, spacing, layout } = useTheme();
  const insets = useSafeAreaInsets();

  const backgroundColor = colors[background] ?? background;

  const contentPadding = {
    paddingTop: safeTop ? insets.top + spacing.md : spacing.md,
    paddingBottom:
      (safeBottom ? insets.bottom : 0) + bottomInset + (scroll ? layout.scrollBottomInset : spacing.md),
    paddingHorizontal: padded ? layout.gutter : 0,
  };

  const inner = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        contentPadding,
        { maxWidth: layout.maxContentWidth, width: '100%', alignSelf: 'center' },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand}
            colors={[colors.brand]}
            progressBackgroundColor={colors.surface}
          />
        ) : undefined
      }
      testID={testID}
      {...rest}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.flex,
        contentPadding,
        { maxWidth: layout.maxContentWidth, width: '100%', alignSelf: 'center' },
        contentContainerStyle,
      ]}
      testID={testID}
      {...rest}
    >
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {inner}
      {footer && (
        <View
          style={{
            paddingHorizontal: padded ? layout.gutter : 0,
            paddingTop: spacing.sm,
            paddingBottom: (safeBottom ? insets.bottom : 0) + spacing.sm,
            backgroundColor,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
          }}
        >
          <View style={{ maxWidth: layout.maxContentWidth, width: '100%', alignSelf: 'center' }}>
            {footer}
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

export default Screen;
