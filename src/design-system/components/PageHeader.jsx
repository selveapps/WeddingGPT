import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme';
import Text from './Text';
import Touchable from './Touchable';
import Icon from './Icon';

/**
 * PageHeader - the title block at the top of every tab.
 *
 * One shape everywhere: a small eyebrow naming the section with an optional
 * trailing control (the notification bell) on the same line, a large title,
 * an optional supporting line, and an optional text action aligned to the
 * title's baseline ("Edit total", "Sort"). Before this, each tab hand-built
 * its own version and the gaps drifted a few pixels apart from tab to tab.
 *
 * `trailing` is a node rather than a built-in bell so the design system does
 * not depend on feature code.
 */
export function PageHeader({
  eyebrow,
  eyebrowColor = 'subtle',
  title,
  subtitle,
  subtitleColor = 'muted',
  /** Node at the end of the eyebrow line, e.g. `<NotificationBell />`. */
  trailing,
  /** Text action beside the title. */
  actionLabel,
  actionIcon,
  onActionPress,
  style,
}) {
  const { spacing } = useTheme();

  return (
    <View style={[{ gap: spacing.xs }, style]}>
      {eyebrow || trailing ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 }}>
          {eyebrow ? (
            <Text variant="eyebrow" color={eyebrowColor}>
              {eyebrow}
            </Text>
          ) : (
            <View />
          )}
          {trailing}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md }}>
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <Text variant="h1" heading>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="bodySm" color={subtitleColor}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {actionLabel && onActionPress ? (
          <Touchable
            onPress={onActionPress}
            haptic="light"
            scaleOnPress={false}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, paddingBottom: spacing.xxs }}
          >
            {actionIcon ? <Icon name={actionIcon} size="sm" color="brand" /> : null}
            <Text variant="actionSm" color="brand">
              {actionLabel}
            </Text>
          </Touchable>
        ) : null}
      </View>
    </View>
  );
}

export default PageHeader;
