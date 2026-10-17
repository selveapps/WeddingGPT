import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Text,
  Card,
  Icon,
  ListRow,
  ScreenHeader,
  SectionHeader,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { Mascot } from '@/features/mascot/Mascot';
import { useInbox } from '@/features/notifications/useInbox';

/**
 * The notification feed: everything coming up that needs doing, most pressing
 * first. New items carry a dot while you look at them, and count as read once
 * you leave - so the bell's count clears without the dots vanishing mid-read.
 */
export default function InboxScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const { items, markRead } = useInbox();

  const seen = useRef([]);
  seen.current = items.map((item) => item.id);
  useEffect(() => () => markRead(seen.current), [markRead]);

  const attention = items.filter((item) => item.kind === 'overdue');
  const upcoming = items.filter((item) => item.kind !== 'overdue');

  return (
    <Screen bottomInset={spacing.xxl}>
      <Stack gap="lg">
        <ScreenHeader
          title="Notifications"
          actionIcon="settings"
          actionLabel="Reminder settings"
          onActionPress={() => router.push(Routes.notifications)}
        />

        {items.length === 0 ? (
          <Stack gap="md" style={{ alignItems: 'center', paddingTop: spacing.xl }}>
            <Mascot size={110} mood="celebrate" />
            <Text variant="h3" heading style={{ textAlign: 'center' }}>
              All clear
            </Text>
            <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
              Nothing due in the next week. I will let you know when something comes up.
            </Text>
          </Stack>
        ) : (
          <>
            {attention.length > 0 ? (
              <Section title="Needs attention" items={attention} onOpen={(url) => router.push(url)} />
            ) : null}
            {upcoming.length > 0 ? (
              <Section title="Coming up" items={upcoming} onOpen={(url) => router.push(url)} />
            ) : null}
          </>
        )}
      </Stack>
    </Screen>
  );
}

function Section({ title, items, onOpen }) {
  return (
    <Stack gap="sm">
      <SectionHeader title={title} />
      <Card padding="none">
        {items.map((item) => (
          <ListRow
            key={item.id}
            leading={<ItemIcon item={item} />}
            title={item.title}
            subtitle={item.body}
            onPress={() => onOpen(item.url)}
            accessibilityLabel={`${item.unread ? 'New. ' : ''}${item.title}. ${item.body}`}
          />
        ))}
      </Card>
    </Stack>
  );
}

function ItemIcon({ item }) {
  const { colors } = useTheme();
  return (
    <View>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors[`${item.tone}Soft`] ?? colors.brandSoft,
        }}
      >
        <Icon name={item.icon} size="sm" color={colors[`${item.tone}SoftInk`] ?? colors.brandSoftInk} />
      </View>
      {item.unread ? (
        <View
          style={{
            position: 'absolute',
            top: -1,
            right: -1,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.brand,
            borderColor: colors.surface,
            borderWidth: 2,
          }}
        />
      ) : null}
    </View>
  );
}
