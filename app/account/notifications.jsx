import React from 'react';
import { Switch } from 'react-native';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Button,
  ListRow,
  ScreenHeader,
  SectionHeader,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { useNotificationStore, selectNotificationPreferences } from '@/store';
import { NOTIFICATION_TYPE_META, NotificationType } from '@/models';
import { analytics, AnalyticsEvents } from '@/services/analytics';
import { useNotificationPermission } from '@/features/notifications/useNotificationPermission';
import { Mascot } from '@/features/mascot/Mascot';

/**
 * Reminder settings: one master switch, then a toggle per kind of reminder.
 *
 * Only the kinds the app can actually send from the device are listed - RSVP
 * and partner activity need a server, so they are not offered until there is
 * one, rather than shown as switches that do nothing.
 */
const LOCAL_TYPES = [
  NotificationType.DAILY_CHECKLIST,
  NotificationType.TASK_DUE,
  NotificationType.TASK_OVERDUE,
  NotificationType.PAYMENT_DUE,
  NotificationType.MILESTONES,
  NotificationType.EVENT_SOON,
  NotificationType.CATERER_NUMBERS,
  NotificationType.VENDOR_APPOINTMENT,
  NotificationType.RUN_OF_SHOW_CUE,
  NotificationType.WEEKLY_DIGEST,
];

export default function NotificationSettingsScreen() {
  const toast = useToast();
  const { colors, spacing } = useTheme();

  const preferences = useNotificationStore(selectNotificationPreferences);
  const setEnabled = useNotificationStore((state) => state.setEnabled);
  const setTypeEnabled = useNotificationStore((state) => state.setTypeEnabled);
  const { granted, supported, status, enable } = useNotificationPermission();

  const on = granted && preferences.enabled;

  const toggleMaster = async (next) => {
    if (!next) {
      setEnabled(false);
      analytics.track(AnalyticsEvents.NOTIFICATION_PREFERENCE_CHANGED, { type: 'all', enabled: false });
      return;
    }
    const ok = await enable();
    if (ok) toast.success('Reminders are on');
    else toast.info('Reminders stay off. Allow notifications for WeddingGPT in Settings to turn them on.');
  };

  const toggleType = (type, next) => {
    setTypeEnabled(type, next);
    analytics.track(AnalyticsEvents.NOTIFICATION_PREFERENCE_CHANGED, { type, enabled: next });
  };

  const switchColors = {
    trackColor: { false: colors.borderStrong, true: colors.brand },
    thumbColor: colors.surface,
    ios_backgroundColor: colors.borderStrong,
  };

  return (
    <Screen bottomInset={spacing.xxl}>
      <Stack gap="lg">
        <ScreenHeader eyebrow="Settings" title="Reminders" />

        <Row gap="md">
          <Mascot size={72} mood={on ? 'celebrate' : 'think'} />
          <Text variant="body" color="muted" style={{ flex: 1 }}>
            {on
              ? 'I will nudge you before things are due - never more than you need.'
              : 'Let me nudge you before deadlines and payments, so nothing sneaks up on you.'}
          </Text>
        </Row>

        {!supported ? (
          <Card tone="sunken">
            <Text variant="bodySm" color="muted">
              Reminders work in the iPhone and Android apps. Open WeddingGPT on your phone to turn them on.
            </Text>
          </Card>
        ) : (
          <>
            <Card padding="none">
              <ListRow
                icon="bell"
                title="Reminders"
                subtitle={
                  on
                    ? 'On'
                    : status === 'denied'
                      ? 'Blocked in system settings'
                      : 'Off'
                }
                trailing={
                  <Switch
                    value={on}
                    onValueChange={toggleMaster}
                    accessibilityLabel="Reminders"
                    {...switchColors}
                  />
                }
              />
            </Card>

            {status === 'denied' ? (
              <Button
                label="Open system settings"
                variant="secondary"
                iconLeft="settings"
                onPress={enable}
              />
            ) : null}

            <Stack gap="xs" style={{ opacity: on ? 1 : 0.5 }}>
              <SectionHeader eyebrow="Choose what you hear about" title="Reminder types" />
              <Card padding="none">
                {LOCAL_TYPES.map((type) => (
                  <ListRow
                    key={type}
                    title={NOTIFICATION_TYPE_META[type].label}
                    subtitle={NOTIFICATION_TYPE_META[type].description}
                    disabled={!on}
                    trailing={
                      <Switch
                        value={preferences.types?.[type] !== false}
                        onValueChange={(next) => toggleType(type, next)}
                        disabled={!on}
                        accessibilityLabel={NOTIFICATION_TYPE_META[type].label}
                        {...switchColors}
                      />
                    }
                  />
                ))}
              </Card>
            </Stack>
          </>
        )}
      </Stack>
    </Screen>
  );
}
