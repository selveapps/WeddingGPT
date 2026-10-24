/**
 * NotificationsSection — master switch, channels, categories, quiet hours, digest.
 */

import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Card,
  ScreenHeader,
  SectionHeader,
  Button,
  ConfirmSheet,
  useToast,
} from '@/design-system/components';

import { useSettingsSection } from '../hooks/useSettings';
import { SettingsChoice } from '../components/SettingsChoice';
import { SettingsToggleRow } from '../components/SettingsToggleRow';
import {
  SETTINGS_SECTIONS,
  SETTINGS_COPY,
  CHANNEL_OPTIONS,
  CATEGORY_OPTIONS,
  QUIET_HOUR_OPTIONS,
  QUIET_HOUR_END_OPTIONS,
  DIGEST_TIME_OPTIONS,
  DIGEST_DAY_OPTIONS,
} from '../lib/settingsConstants';

export function NotificationsSection() {
  const router = useRouter();
  const toast = useToast();
  const {
    settings,
    setSetting,
    setNotificationChannel,
    setNotificationCategory,
    dirty,
    confirmOpen,
    requestReset,
    cancelReset,
    confirmReset,
  } = useSettingsSection(SETTINGS_SECTIONS.NOTIFICATIONS);

  const save = useCallback(() => toast.success(SETTINGS_COPY.saveToast), [toast]);

  return (
    <Screen testID="settings-notifications" edges={['top', 'bottom']}>
      <ScreenHeader
        title="Notifications"
        onBack={() => router.back()}
        trailing={
          dirty ? (
            <Button variant="ghost" size="sm" onPress={requestReset} label={SETTINGS_COPY.resetSection} />
          ) : null
        }
      />
      <Stack gap="lg" style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <Card>
          <SettingsToggleRow
            label={SETTINGS_COPY.notificationsMaster}
            description={SETTINGS_COPY.notificationsMasterDescription}
            value={settings.notificationsEnabled}
            onValueChange={(v) => {
              setSetting('notificationsEnabled', v);
              save();
            }}
            testID="settings-notifications-master"
          />
        </Card>

        <SectionHeader title={SETTINGS_COPY.channelsTitle} />
        <Card>
          {CHANNEL_OPTIONS.map((opt) => (
            <SettingsToggleRow
              key={opt.value}
              label={opt.label}
              description={opt.description}
              value={settings.notificationChannels?.[opt.value]}
              disabled={!settings.notificationsEnabled}
              onValueChange={(v) => {
                setNotificationChannel(opt.value, v);
                save();
              }}
              testID={`settings-channel-${opt.value}`}
            />
          ))}
        </Card>

        <SectionHeader title={SETTINGS_COPY.categoriesTitle} />
        <Card>
          {CATEGORY_OPTIONS.map((opt) => (
            <SettingsToggleRow
              key={opt.value}
              label={opt.label}
              description={opt.description}
              value={settings.notificationCategories?.[opt.value]}
              disabled={!settings.notificationsEnabled}
              onValueChange={(v) => {
                setNotificationCategory(opt.value, v);
                save();
              }}
              testID={`settings-category-${opt.value}`}
            />
          ))}
        </Card>

        <SectionHeader
          title={SETTINGS_COPY.quietHoursTitle}
          subtitle={SETTINGS_COPY.quietHoursDescription}
        />
        <Card>
          <SettingsToggleRow
            label="Enable quiet hours"
            value={settings.quietHoursEnabled}
            disabled={!settings.notificationsEnabled}
            onValueChange={(v) => {
              setSetting('quietHoursEnabled', v);
              save();
            }}
            testID="settings-quiet-enabled"
          />
        </Card>
        {settings.quietHoursEnabled ? (
          <Stack gap="md">
            <SettingsChoice
              label="Quiet hours begin"
              options={QUIET_HOUR_OPTIONS}
              value={settings.quietHoursStart}
              onChange={(v) => {
                setSetting('quietHoursStart', v);
                save();
              }}
              testID="settings-quiet-start"
            />
            <SettingsChoice
              label="Quiet hours end"
              options={QUIET_HOUR_END_OPTIONS}
              value={settings.quietHoursEnd}
              onChange={(v) => {
                setSetting('quietHoursEnd', v);
                save();
              }}
              testID="settings-quiet-end"
            />
          </Stack>
        ) : null}

        <SectionHeader
          title={SETTINGS_COPY.digestTitle}
          subtitle={SETTINGS_COPY.digestDescription}
        />
        <Card>
          <SettingsToggleRow
            label="Weekly digest"
            value={settings.digestEnabled}
            disabled={!settings.notificationsEnabled}
            onValueChange={(v) => {
              setSetting('digestEnabled', v);
              save();
            }}
            testID="settings-digest-enabled"
          />
        </Card>
        {settings.digestEnabled ? (
          <Stack gap="md">
            <SettingsChoice
              label="Digest time"
              options={DIGEST_TIME_OPTIONS}
              value={settings.digestTime}
              onChange={(v) => {
                setSetting('digestTime', v);
                save();
              }}
              testID="settings-digest-time"
            />
            <SettingsChoice
              label="Digest days"
              description="Tap to cycle preferred days (stored as multi-select list)."
              options={DIGEST_DAY_OPTIONS}
              value={settings.digestDays?.[0] ?? 'monday'}
              onChange={(v) => {
                const current = new Set(settings.digestDays || []);
                if (current.has(v)) current.delete(v);
                else current.add(v);
                const next = Array.from(current);
                setSetting('digestDays', next.length ? next : [v]);
                save();
              }}
              testID="settings-digest-days"
            />
          </Stack>
        ) : null}
      </Stack>
      <ConfirmSheet
        open={confirmOpen}
        title="Reset notifications?"
        body="Channels, categories and quiet hours return to defaults."
        confirmLabel={SETTINGS_COPY.resetConfirmAction}
        onConfirm={confirmReset}
        onCancel={cancelReset}
      />
    </Screen>
  );
}

export default NotificationsSection;
