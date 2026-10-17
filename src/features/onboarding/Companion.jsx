import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Stack, Text, Icon } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Mascot } from '@/features/mascot/Mascot';
import { AppIcon } from '@/features/mascot/AppIcon';

/**
 * The onboarding companion - the swan couple mascot, beside a speech bubble.
 *
 * One presence carries the whole journey instead of a stack of form screens:
 * The swans stay put and "say" each question in a bubble. Their mood follows the
 * question (thinking for "when?" and "where?", celebrating at the end), and
 * the bubble is keyed by its text, so a new line arrives with a short fade.
 *
 * `mood="brand"` shows the app icon itself instead of the swans, for any screen
 * that should open on the logo.
 *
 *  - `size` 'sm' sits beside the bubble; 'lg' stacks the bubble below.
 */
const SIZES = { sm: 60, lg: 128 };
const BRAND_SIZES = { sm: 52, lg: 104 };

export function CompanionMark({ size = 'sm', mood = 'happy' }) {
  if (mood === 'brand') return <AppIcon size={BRAND_SIZES[size] ?? size} />;
  const px = SIZES[size] ?? size;
  return <Mascot size={px} mood={mood} />;
}

/** What the companion says. One short line, plus an optional quieter hint. */
export function SpeechBubble({ message, hint, tail = 'left' }) {
  const { colors, spacing, radii, borderWidths, shadows } = useTheme();

  return (
    <Animated.View
      key={message}
      entering={FadeIn.duration(220)}
      style={{ flexShrink: 1 }}
      accessibilityLiveRegion="polite"
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: borderWidths.hairline,
          borderRadius: radii.lg,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          ...shadows.sm,
        }}
      >
        {/* The tail: a rotated square tucked under the bubble's edge. */}
        <View
          style={[
            {
              position: 'absolute',
              width: 12,
              height: 12,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              transform: [{ rotate: '45deg' }],
            },
            tail === 'left'
              ? { left: -6.5, top: 20, borderLeftWidth: borderWidths.hairline, borderBottomWidth: borderWidths.hairline }
              : { top: -6.5, alignSelf: 'center', borderLeftWidth: borderWidths.hairline, borderTopWidth: borderWidths.hairline },
          ]}
        />
        <Stack gap="hair">
          <Text variant="h3" heading accessibilityRole="header">
            {message}
          </Text>
          {hint ? (
            <Text variant="bodySm" color="muted">
              {hint}
            </Text>
          ) : null}
        </Stack>
      </View>
    </Animated.View>
  );
}

/** Mark and bubble together, laid out for either size. */
export function Companion({ message, hint, size = 'sm', mood = 'happy' }) {
  const { spacing } = useTheme();

  if (size === 'lg') {
    return (
      <View style={{ alignItems: 'center', gap: spacing.lg }}>
        <CompanionMark size="lg" mood={mood} />
        {message ? <SpeechBubble message={message} hint={hint} tail="top" /> : null}
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
      <CompanionMark size="sm" mood={mood} />
      <View style={{ flex: 1 }}>
        {message ? <SpeechBubble message={message} hint={hint} /> : null}
      </View>
    </View>
  );
}

export default Companion;
