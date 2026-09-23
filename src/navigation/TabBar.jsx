import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
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
 * Receives the standard React Navigation tab bar props from expo-router.
 */
export function TabBar({ state, navigation }) {
  const { colors, spacing, layout, borderWidths } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: insets.bottom || spacing.xs,
          paddingTop: spacing.xs,
          paddingHorizontal: spacing.xs,
          minHeight: layout.tabBarHeight + insets.bottom,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: borderWidths.hairline,
        },
      ]}
    >
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

function TabItem({ label, icon, focused, onPress, isAssistant }) {
  const { colors, spacing, radii } = useTheme();
  const motion = useMotion();

  // Derived rather than an effect: the value follows `focused` without an
  // extra render pass, so the pill never lags the route change by a frame.
  const progress = useDerivedValue(
    () => withSpring(focused ? 1 : 0, motion.springs.gentle),
    [focused]
  );

  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.86 + progress.value * 0.14 }],
  }));

  const activeColor = isAssistant ? colors.accentSoftInk : colors.brandSoftInk;
  const pillColor = isAssistant ? colors.accentSoft : colors.brandSoft;

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
      <View style={[styles.itemInner, { gap: 2, paddingVertical: spacing.hair }]}>
        <View style={styles.iconWrap}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: pillColor,
                borderRadius: radii.pill,
                marginHorizontal: -6,
              },
              pillStyle,
            ]}
          />
          <Icon
            name={icon}
            size="lg"
            color={focused ? activeColor : colors.inkSubtle}
            filled={false}
          />
        </View>

        <Text
          variant="caption"
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
    width: 44,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TabBar;
