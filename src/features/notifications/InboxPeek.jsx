import React, { useEffect, useRef, useState } from 'react';
import { AppState, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';

import { Icon, Text, Touchable } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { useInbox } from './useInbox';

/** How long the peek stays up. */
const VISIBLE_MS = 5000;
/** Wait for the first frame of the dashboard to settle before sliding in. */
const OPEN_DELAY_MS = 900;
/** Coming back after at least this long counts as "opening the app" again. */
const AWAY_MS = 10 * 60 * 1000;

/** Once per launch, even if the tab shell remounts. */
let shownThisLaunch = false;

/**
 * A small card that slides in at the top-right corner when the app opens,
 * showing the most pressing thing coming up, and slides away after five
 * seconds. Tapping it opens the full feed; the x dismisses it early.
 *
 * Nothing to show, nothing appears. It is deliberately one line of content -
 * the feed is where the detail lives.
 */
export function InboxPeek() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, spacing, radii, borderWidths, shadows } = useTheme();
  const { items } = useInbox();

  const [peek, setPeek] = useState(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const hideTimer = useRef(null);

  const show = () => {
    const current = itemsRef.current;
    if (current.length === 0) return;
    const top = current.find((item) => item.unread) ?? current[0];
    setPeek({ item: top, more: current.length - 1 });
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setPeek(null), VISIBLE_MS);
  };

  // On launch.
  useEffect(() => {
    if (shownThisLaunch) return undefined;
    shownThisLaunch = true;
    const timer = setTimeout(show, OPEN_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On coming back after a while.
  useEffect(() => {
    let leftAt = null;
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') leftAt = Date.now();
      if (next === 'active' && leftAt && Date.now() - leftAt >= AWAY_MS) setTimeout(show, OPEN_DELAY_MS);
      if (next === 'active') leftAt = null;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  if (!peek) return null;

  const { item, more } = peek;
  const close = () => {
    clearTimeout(hideTimer.current);
    setPeek(null);
  };
  const open = () => {
    close();
    router.push(Routes.inbox);
  };

  return (
    <Animated.View
      entering={SlideInRight.duration(280)}
      exiting={SlideOutRight.duration(220)}
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: insets.top + spacing.xs,
        right: spacing.sm,
        width: Math.min(280, width - spacing.sm * 2),
        zIndex: 100,
        elevation: 12,
      }}
    >
      <Touchable
        onPress={open}
        haptic="light"
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${item.body}. Opens notifications.`}
        accessibilityLiveRegion="polite"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingVertical: spacing.xs,
          paddingLeft: spacing.xs,
          paddingRight: spacing.xxs,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: borderWidths.hairline,
          borderRadius: radii.lg,
          ...shadows.md,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors[`${item.tone}Soft`] ?? colors.brandSoft,
          }}
        >
          <Icon name={item.icon} size="sm" color={colors[`${item.tone}SoftInk`] ?? colors.brandSoftInk} />
        </View>

        <View style={{ flex: 1 }}>
          <Text variant="labelStrong" numberOfLines={1}>
            {item.title}
          </Text>
          <Text variant="caption" color="muted" numberOfLines={1}>
            {more > 0 ? `${item.body} · +${more} more` : item.body}
          </Text>
        </View>

        <Touchable onPress={close} hitSlop={10} accessibilityLabel="Dismiss" style={{ padding: 4 }}>
          <Icon name="close" size="sm" color="inkSubtle" />
        </Touchable>
      </Touchable>
    </Animated.View>
  );
}

export default InboxPeek;
