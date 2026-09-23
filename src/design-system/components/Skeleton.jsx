import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

import { useTheme, useMotion } from '../theme';
import { decorative } from './a11y';

/**
 * Skeleton - the loading placeholder used instead of spinners inside content.
 *
 * A gentle opacity pulse rather than a travelling shimmer: a sweeping highlight
 * draws the eye to the wrong thing and reads as "busy" rather than "calm",
 * which is the wrong note for this product.
 *
 * Under Reduce Motion the pulse stops and a static tint is shown.
 */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = 'sm',
  style,
}) {
  const { colors, radii } = useTheme();
  const motion = useMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (motion.reduceMotion) {
      pulse.value = 1;
      return undefined;
    }

    pulse.value = withRepeat(
      withTiming(0.45, { duration: motion.durations.slower }),
      -1,
      true
    );

    return () => cancelAnimation(pulse);
  }, [pulse, motion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      {...decorative}
      style={[
        {
          width,
          height,
          borderRadius: typeof radius === 'number' ? radius : radii[radius] ?? radii.sm,
          backgroundColor: colors.skeleton,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/**
 * A pre-composed skeleton shaped like a `ListRow`, so loading lists have the
 * same rhythm as the content that replaces them and nothing shifts on arrival.
 */
export function SkeletonRow({ showAvatar = true, lines = 2, style }) {
  const { spacing, avatarSizes } = useTheme();

  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
        style,
      ]}
    >
      {showAvatar && (
        <Skeleton width={avatarSizes.md} height={avatarSizes.md} radius="pill" />
      )}
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Skeleton width="62%" height={14} />
        {lines > 1 && <Skeleton width="86%" height={12} />}
      </View>
    </View>
  );
}

/** A card-shaped block, for dashboard tiles loading in. */
export function SkeletonCard({ height = 120, style }) {
  const { radii } = useTheme();
  return <Skeleton width="100%" height={height} radius={radii.lg} style={style} />;
}

export default Skeleton;
