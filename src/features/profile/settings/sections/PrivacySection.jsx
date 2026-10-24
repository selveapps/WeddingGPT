/**
 * PrivacySection — analytics, visibility levels, contact/location permissions.
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
  Text,
  ConfirmSheet,
  useToast,
} from '@/design-system/components';

import { useSettingsSection } from '../hooks/useSettings';
import { SettingsChoice } from '../components/SettingsChoice';
import { SettingsToggleRow } from '../components/SettingsToggleRow';
import {
  SETTINGS_SECTIONS,
  SETTINGS_COPY,
  PRIVACY_LEVEL_OPTIONS,
} from '../lib/settingsConstants';

export function PrivacySection() {
  const router = useRouter();
  const toast = useToast();
  const {
    settings,
    setSetting,
    privacy,
    privacyLabel,
    dirty,
    confirmOpen,
    requestReset,
    cancelReset,
    confirmReset,
  } = useSettingsSection(SETTINGS_SECTIONS.PRIVACY);

  const save = useCallback(() => toast.success(SETTINGS_COPY.saveToast), [toast]);

  return (
    <Screen testID="settings-privacy" edges={['top', 'bottom']}>
      <ScreenHeader
        title="Privacy & security"
        onBack={() => router.back()}
        trailing={
          dirty ? (
            <Button variant="ghost" size="sm" onPress={requestReset} label={SETTINGS_COPY.resetSection} />
          ) : null
        }
      />
      <Stack gap="lg" style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <Card>
          <Stack gap="xs">
            <Text variant="label">Privacy score</Text>
            <Text variant="title">
              {privacy.score} / {privacy.max}
            </Text>
            <Text variant="caption" color="muted">
              {privacyLabel} — higher means fewer data shares and tighter visibility.
            </Text>
          </Stack>
        </Card>

        <SectionHeader title="Diagnostics & product" />
        <Card>
          <SettingsToggleRow
            label={SETTINGS_COPY.analyticsLabel}
            description={SETTINGS_COPY.analyticsDescription}
            value={settings.analyticsEnabled}
            onValueChange={(v) => {
              setSetting('analyticsEnabled', v);
              save();
            }}
            testID="settings-analytics"
          />
          <SettingsToggleRow
            label={SETTINGS_COPY.crashLabel}
            description={SETTINGS_COPY.crashDescription}
            value={settings.crashReportsEnabled}
            onValueChange={(v) => {
              setSetting('crashReportsEnabled', v);
              save();
            }}
            testID="settings-crash"
          />
          <SettingsToggleRow
            label={SETTINGS_COPY.personalizationLabel}
            description={SETTINGS_COPY.personalizationDescription}
            value={settings.personalizationEnabled}
            onValueChange={(v) => {
              setSetting('personalizationEnabled', v);
              save();
            }}
            testID="settings-personalization"
          />
          <SettingsToggleRow
            label={SETTINGS_COPY.sharePartnersLabel}
            description={SETTINGS_COPY.sharePartnersDescription}
            value={settings.shareUsageWithPartners}
            onValueChange={(v) => {
              setSetting('shareUsageWithPartners', v);
              save();
            }}
            testID="settings-share-partners"
          />
        </Card>

        <SectionHeader title="Visibility" />
        <SettingsChoice
          label={SETTINGS_COPY.visibilityProfile}
          options={PRIVACY_LEVEL_OPTIONS}
          value={settings.profileVisibility}
          onChange={(v) => {
            setSetting('profileVisibility', v);
            save();
          }}
          testID="settings-profile-visibility"
        />
        <SettingsChoice
          label={SETTINGS_COPY.visibilityGuests}
          options={PRIVACY_LEVEL_OPTIONS}
          value={settings.guestListVisibility}
          onChange={(v) => {
            setSetting('guestListVisibility', v);
            save();
          }}
          testID="settings-guest-visibility"
        />
        <SettingsChoice
          label={SETTINGS_COPY.visibilityBudget}
          options={PRIVACY_LEVEL_OPTIONS}
          value={settings.budgetVisibility}
          onChange={(v) => {
            setSetting('budgetVisibility', v);
            save();
          }}
          testID="settings-budget-visibility"
        />

        <SectionHeader title="Device permissions" />
        <Card>
          <SettingsToggleRow
            label={SETTINGS_COPY.contactImportLabel}
            value={settings.allowContactImport}
            onValueChange={(v) => {
              setSetting('allowContactImport', v);
              save();
            }}
            testID="settings-contact-import"
          />
          <SettingsToggleRow
            label={SETTINGS_COPY.locationVendorsLabel}
            value={settings.allowLocationForLocalVendors}
            onValueChange={(v) => {
              setSetting('allowLocationForLocalVendors', v);
              save();
            }}
            testID="settings-location-vendors"
          />
        </Card>
      </Stack>
      <ConfirmSheet
        open={confirmOpen}
        title="Reset privacy?"
        body="Analytics, visibility and permission defaults are restored."
        confirmLabel={SETTINGS_COPY.resetConfirmAction}
        onConfirm={confirmReset}
        onCancel={cancelReset}
      />
    </Screen>
  );
}

export default PrivacySection;
