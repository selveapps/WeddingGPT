/**
 * AppearanceSection — theme, density, font scale, accent, illustrations.
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
import { useTheme } from '@/design-system/theme';

import { useSettingsSection } from '../hooks/useSettings';
import { SettingsChoice } from '../components/SettingsChoice';
import { SettingsToggleRow } from '../components/SettingsToggleRow';
import {
  SETTINGS_SECTIONS,
  SETTINGS_COPY,
  THEME_OPTIONS,
  DENSITY_OPTIONS,
  FONT_SCALE_OPTIONS,
  ACCENT_OPTIONS,
} from '../lib/settingsConstants';
import { applyThemePreference } from '../lib/settingsHelpers';

export function AppearanceSection() {
  const router = useRouter();
  const toast = useToast();
  const theme = useTheme();
  const {
    settings,
    setSetting,
    dirty,
    confirmOpen,
    requestReset,
    cancelReset,
    confirmReset,
  } = useSettingsSection(SETTINGS_SECTIONS.APPEARANCE);

  const onThemeChange = useCallback(
    (value) => {
      setSetting('themePreference', value);
      // Bridge into existing ThemeProvider if it exposes setPreference on context
      if (typeof theme.setPreference === 'function') {
        applyThemePreference(value, theme.setPreference);
      }
      toast.success(SETTINGS_COPY.saveToast);
    },
    [setSetting, theme, toast]
  );

  const onChange = useCallback(
    (key) => (value) => {
      setSetting(key, value);
      toast.success(SETTINGS_COPY.saveToast);
    },
    [setSetting, toast]
  );

  return (
    <Screen testID="settings-appearance" edges={['top', 'bottom']}>
      <ScreenHeader
        title="Appearance"
        subtitle={SETTINGS_COPY.hubSubtitle}
        onBack={() => router.back()}
        trailing={
          dirty ? (
            <Button variant="ghost" size="sm" onPress={requestReset} label={SETTINGS_COPY.resetSection} />
          ) : null
        }
      />
      <Stack gap="lg" style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <SectionHeader eyebrow="Look" title="Theme & layout" />
        <SettingsChoice
          label={SETTINGS_COPY.themeLabel}
          description={SETTINGS_COPY.themeDescription}
          options={THEME_OPTIONS}
          value={settings.themePreference}
          onChange={onThemeChange}
          testID="settings-theme"
        />
        <SettingsChoice
          label={SETTINGS_COPY.densityLabel}
          description={SETTINGS_COPY.densityDescription}
          options={DENSITY_OPTIONS}
          value={settings.density}
          onChange={onChange('density')}
          testID="settings-density"
        />
        <SettingsChoice
          label={SETTINGS_COPY.fontScaleLabel}
          description={SETTINGS_COPY.fontScaleDescription}
          options={FONT_SCALE_OPTIONS}
          value={settings.fontScale}
          onChange={onChange('fontScale')}
          testID="settings-font-scale"
        />
        <SettingsChoice
          label={SETTINGS_COPY.accentLabel}
          description={SETTINGS_COPY.accentDescription}
          options={ACCENT_OPTIONS}
          value={settings.accent}
          onChange={onChange('accent')}
          testID="settings-accent"
        />
        <SectionHeader eyebrow="Extras" title="Polish" />
        <Card>
          <SettingsToggleRow
            label={SETTINGS_COPY.illustrationsLabel}
            description={SETTINGS_COPY.illustrationsDescription}
            value={settings.showDecorativeIllustrations}
            onValueChange={(v) => {
              setSetting('showDecorativeIllustrations', v);
              toast.success(SETTINGS_COPY.saveToast);
            }}
            testID="settings-illustrations"
          />
          <SettingsToggleRow
            label={SETTINGS_COPY.reduceTransparencyLabel}
            description={SETTINGS_COPY.reduceTransparencyDescription}
            value={settings.reduceTransparency}
            onValueChange={(v) => {
              setSetting('reduceTransparency', v);
              toast.success(SETTINGS_COPY.saveToast);
            }}
            testID="settings-reduce-transparency"
          />
        </Card>
      </Stack>
      <ConfirmSheet
        open={confirmOpen}
        title="Reset appearance?"
        body="Theme, density, font size and accent return to defaults."
        confirmLabel={SETTINGS_COPY.resetConfirmAction}
        onConfirm={confirmReset}
        onCancel={cancelReset}
      />
    </Screen>
  );
}

export default AppearanceSection;
