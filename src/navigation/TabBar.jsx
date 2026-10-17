import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme, useMotion } from '../design-system/theme';
import { Text, Icon, Touchable } from '../design-system/components';
import { TAB_ITEMS } from './routes';

/**
 * The bottom navigation bar.
 *
 * Custom rather than the stock tab bar for two reasons the PRD cares about: it
 * has to carry the brand's warmth (a soft pill behind the active tab, not a
 * tinted glyph), and the Assistant tab needs to read as a distinct affordance
 * rather than a fifth equal item.
 *
 * The active-tab pill is one shared indicator that glides from tab to tab,
 * rather than a pill per tab fading in and out - your eye follows it, which is
 * what makes switching feel like moving through one app instead of jumping
 * between five.
 *
 * Receives the standard React Navigation tab bar props from expo-router.
 */
export function TabBar({ state, navigation }) {
  const { colors, spacing, layout, borderWidths } = useTheme();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);

  // Phones with a home indicator already get generous room from the inset;
  // older phones get a real bottom margin so labels do not sit on the edge.
  const padding = {
    paddingBottom: Math.max(insets.bottom, spacing.sm),
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  };
  const visible = state.routes.filter((route) => TAB_ITEMS.some((tab) => tab.name === route.name));
  const activeName = state.routes[state.index]?.name;
  const activeSlot = Math.max(0, visible.findIndex((route) => route.name === activeName));
  const itemWidth = width > 0 ? (width - spacing.xs * 2) / Math.max(1, visible.length) : 0;

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[
        styles.bar,
        padding,
        {
          minHeight: layout.tabBarHeight + insets.bottom,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: borderWidths.hairline,
        },
      ]}
    >
      {itemWidth > 0 ? (
        <Indicator
          slot={activeSlot}
          itemWidth={itemWidth}
          isAssistant={activeName === 'ai'}
          padding={padding}
        />
      ) : null}

      {state.routes.map((route, index) => {
        const item = TAB_ITEMS.find((tab) => tab.name === route.name);
        if (!item) return null;

        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          // Tapping the active tab should pop that stack to its root, which is
          // what `navigate` to an already-focused route does by default.
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabItem
            key={route.key}
            label={item.label}
            icon={item.icon}
            focused={focused}
            onPress={onPress}
            isAssistant={item.name === 'ai'}
          />
        );
      })}
    </View>
  );
}

/**
 * The gliding pill. It sits in an overlay laid out exactly like a tab item -
 * same paddings, an icon-sized box above an invisible caption - so it lines
 * up behind the icon without measuring anything but the bar's width.
 */
function Indicator({ slot, itemWidth, isAssistant, padding }) {
  const { colors, spacing, radii } = useTheme();
  const motion = useMotion();

  const x = useSharedValue(slot * itemWidth);
  const tone = useSharedValue(isAssistant ? 1 : 0);

  useEffect(() => {
    const config = { duration: motion.reduceMotion ? 0 : 260, easing: Easing.bezier(0.2, 0, 0, 1) };
    x.value = withTiming(slot * itemWidth, config);
    tone.value = withTiming(isAssistant ? 1 : 0, config);
  }, [slot, itemWidth, isAssistant, motion.reduceMotion, x, tone]);

  const brandSoft = colors.brandSoft;
  const accentSoft = colors.accentSoft;
  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const fill = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(tone.value, [0, 1], [brandSoft, accentSoft]),
  }));

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, padding, styles.bar]}>
      <Animated.View style={[{ width: itemWidth }, styles.itemInner, { gap: spacing.xxs }, slide]}>
        <View style={styles.iconWrap}>
          <Animated.View
            style={[StyleSheet.absoluteFill, { borderRadius: radii.pill, marginHorizontal: -6 }, fill]}
          />
        </View>
        <Text variant="tab" style={{ opacity: 0 }} numberOfLines={1}>
          {' '}
        </Text>
      </Animated.View>
    </View>
  );
}

function TabItem({ label, icon, focused, onPress, isAssistant }) {
  const { colors, spacing } = useTheme();

  const activeColor = isAssistant ? colors.accentSoftInk : colors.brandSoftInk;

  return (
    <Touchable
      onPress={onPress}
      haptic="selection"
      scaleOnPress={false}
      hitSlop={0}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      style={styles.item}
    >
      <View style={[styles.itemInner, { gap: spacing.xxs }]}>
        <View style={styles.iconWrap}>
          <Icon
            name={icon}
            size="lg"
            color={focused ? activeColor : colors.inkSubtle}
            filled={false}
          />
        </View>

        <Text
          variant={focused ? 'tabActive' : 'tab'}
          style={{ color: focused ? activeColor : colors.inkSubtle }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  item: {
    flex: 1,
  },
  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 48,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TabBar;
