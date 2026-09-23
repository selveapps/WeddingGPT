import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme';
import Text from './Text';
import Touchable from './Touchable';
import Icon from './Icon';

/**
 * SectionHeader - the standard way a screen introduces a block of content.
 *
 * Keeps a consistent shape everywhere: optional eyebrow, a title, optional
 * supporting line, and an optional trailing action. Because every module uses
 * it, section rhythm stays identical across Home, Planning, Budget and Guests.
 */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  /** Trailing text action, e.g. "See all". */
  actionLabel,
  onActionPress,
  actionIcon = 'chevronRight',
  style,
}) {
  const { spacing } = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: spacing.md,
        },
        style,
      ]}
    >
      <View style={{ flex: 1, gap: spacing.hair }}>
        {eyebrow && (
          <Text variant="eyebrow" color="subtle">
            {eyebrow}
          </Text>
        )}
        <Text variant="h2" heading>
          {title}
        </Text>
        {subtitle && (
          <Text variant="bodySm" color="muted">
            {subtitle}
          </Text>
        )}
      </View>

      {actionLabel && onActionPress && (
        <Touchable
          onPress={onActionPress}
          haptic="light"
          scaleOnPress={false}
          accessibilityLabel={actionLabel}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingBottom: 2 }}
        >
          <Text variant="actionSm" color="brand">
            {actionLabel}
          </Text>
          {actionIcon && <Icon name={actionIcon} size="sm" color="brand" />}
        </Touchable>
      )}
    </View>
  );
}

export default SectionHeader;
