import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  Screen,
  Stack,
  Card,
  ScreenHeader,
  Button,
  ConfirmSheet,
  useToast,
} from '@/design-system/components';
import { useSettingsSection } from '../hooks/useSettings';
import { SettingsToggleRow } from '../components/SettingsToggleRow';
import { SETTINGS_SECTIONS, SETTINGS_COPY } from '../lib/settingsConstants';

export function AccessibilitySection() {
  const router = useRouter();
  const toast = useToast();
  const { settings, setSetting, dirty, confirmOpen, requestReset, cancelReset, confirmReset } =
    useSettingsSection(SETTINGS_SECTIONS.ACCESSIBILITY);
  const save = useCallback(() => toast.success(SETTINGS_COPY.saveToast), [toast]);

  const rows = [
    ['highContrast', SETTINGS_COPY.highContrastLabel, null],
    ['boldText', SETTINGS_COPY.boldTextLabel, null],
    ['largerTouchTargets', SETTINGS_COPY.largerTargetsLabel, null],
    ['screenReaderHints', SETTINGS_COPY.screenReaderLabel, null],
    ['announceNotifications', SETTINGS_COPY.announceLabel, null],
    ['reduceTransparency', SETTINGS_COPY.reduceTransparencyLabel, SETTINGS_COPY.reduceTransparencyDescription],
  ];

  return (
    <Screen testID="settings-accessibility" edges={['top', 'bottom']}>
      <ScreenHeader
        title="Accessibility"
        onBack={() => router.back()}
        trailing={
          dirty ? (
            <Button variant="ghost" size="sm" onPress={requestReset} label={SETTINGS_COPY.resetSection} />
          ) : null
        }
      />
      <Stack gap="lg" style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <Card>
          {rows.map(([key, label, description]) => (
            <SettingsToggleRow
              key={key}
              label={label}
              description={description}
              value={settings[key]}
              onValueChange={(v) => {
                setSetting(key, v);
                save();
              }}
              testID={`settings-a11y-${key}`}
            />
          ))}
        </Card>
      </Stack>
      <ConfirmSheet
        open={confirmOpen}
        title="Reset accessibility?"
        body="Contrast, text and touch target preferences return to defaults."
        confirmLabel={SETTINGS_COPY.resetConfirmAction}
        onConfirm={confirmReset}
        onCancel={cancelReset}
      />
    </Screen>
  );
}

export default AccessibilitySection;
