import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme, useMotion } from '../theme';
import Touchable from './Touchable';
import Text from './Text';

/**
 * SegmentedControl - exclusive choice between 2-4 short options.
 *
 * Used for RSVP filters, budget views and planning timeframes. A sliding
 * indicator travels to the active segment rather than each segment toggling its
 * own background, which makes the change of state feel continuous.
 *
 * The indicator is positioned from a measured track width so segments can be
 * unequal in label length without the pill drifting.
 */
export function SegmentedControl({
  /** [{ value, label }] */
  options = [],
  value,
  onChange,
  size = 'md',
  style,
  testID,
}) {
  const { colors, spacing, radii, controlHeights, borderWidths } = useTheme();
  const motion = useMotion();

  const [trackWidth, setTrackWidth] = useState(0);
  const offset = useSharedValue(0);

  const count = Math.max(1, options.length);
  const segmentWidth = trackWidth ? trackWidth / count : 0;
  const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));

  const handleLayout = useCallback(
    (event) => {
      const width = event.nativeEvent.layout.width;
      setTrackWidth(width);
      // Place the indicator without animating on first measure.
      offset.value = (width / count) * activeIndex;
    },
    [count, activeIndex, offset]
  );

  const handlePress = useCallback(
    (option, index) => {
      if (option.value === value) return;
      offset.value = withSpring(segmentWidth * index, motion.springs.gentle);
      onChange?.(option.value);
    },
    [value, segmentWidth, offset, motion, onChange]
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const height = controlHeights[size] ?? controlHeights.md;
  const pad = 3;

  return (
    <View
      onLayout={handleLayout}
      testID={testID}
      accessibilityRole="tablist"
      style={[
        styles.track,
        {
          height,
          padding: pad,
          borderRadius: radii.md,
          backgroundColor: colors.surfaceSunken,
          borderWidth: borderWidths.hairline,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {trackWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: segmentWidth - pad * 2,
              top: pad,
              bottom: pad,
              left: pad,
              borderRadius: radii.sm,
              backgroundColor: colors.surface,
            },
            indicatorStyle,
          ]}
        />
      )}

      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <Touchable
            key={String(option.value)}
            onPress={() => handlePress(option, index)}
            haptic="selection"
            scaleOnPress={false}
            hitSlop={0}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            style={styles.segment}
          >
            <Text
              variant="actionSm"
              color={active ? 'default' : 'subtle'}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Touchable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'stretch',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SegmentedControl;
