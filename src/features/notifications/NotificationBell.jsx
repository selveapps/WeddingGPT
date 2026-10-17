import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { Icon, Text, Touchable } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { useInbox } from './useInbox';

/**
 * The bell in the top-right corner of every tab. Opens the notification feed;
 * a small count shows how many items have not been seen yet.
 */
export function NotificationBell() {
  const router = useRouter();
  const { colors, borderWidths } = useTheme();
  const { unreadCount } = useInbox();

  const label = unreadCount > 0 ? `Notifications, ${unreadCount} new` : 'Notifications';

  return (
    <Touchable
      onPress={() => router.push(Routes.inbox)}
      haptic="light"
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: borderWidths.hairline,
      }}
    >
      <Icon name="bell" size="md" color={unreadCount > 0 ? 'brand' : 'inkMuted'} />
      {unreadCount > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: -3,
            right: -3,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 4,
            borderRadius: 9,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.brand,
            borderColor: colors.canvas,
            borderWidth: 2,
          }}
        >
          <Text variant="caption" style={{ color: colors.inkOnBrand, fontSize: 10, lineHeight: 12 }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      ) : null}
    </Touchable>
  );
}

export default NotificationBell;
