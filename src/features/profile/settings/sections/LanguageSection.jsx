import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  Screen,
  Stack,
  ScreenHeader,
  Button,
  ConfirmSheet,
  useToast,
} from '@/design-system/components';
import { useSettingsSection } from '../hooks/useSettings';
import { SettingsChoice } from '../components/SettingsChoice';
import {
  SETTINGS_SECTIONS,
  SETTINGS_COPY,
  LOCALE_OPTIONS,
  CALENDAR_OPTIONS,
  WEEK_START_OPTIONS,
  CURRENCY_DISPLAY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  TIME_FORMAT_OPTIONS,
  NAME_ORDER_OPTIONS,
} from '../lib/settingsConstants';

export function LanguageSection() {
  const router = useRouter();
  const toast = useToast();
  const { settings, setSetting, dirty, confirmOpen, requestReset, cancelReset, confirmReset } =
    useSettingsSection(SETTINGS_SECTIONS.LANGUAGE);
  const save = useCallback(() => toast.success(SETTINGS_COPY.saveToast), [toast]);
  const on = (key) => (v) => {
    setSetting(key, v);
    save();
  };

  return (
    <Screen testID="settings-language" edges={['top', 'bottom']}>
      <ScreenHeader
        title="Language & region"
        onBack={() => router.back()}
        trailing={
          dirty ? (
            <Button variant="ghost" size="sm" onPress={requestReset} label={SETTINGS_COPY.resetSection} />
          ) : null
        }
      />
      <Stack gap="lg" style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <SettingsChoice
          label={SETTINGS_COPY.localeLabel}
          options={LOCALE_OPTIONS}
          value={settings.locale}
          onChange={on('locale')}
          testID="settings-locale"
        />
        <SettingsChoice
          label={SETTINGS_COPY.calendarLabel}
          options={CALENDAR_OPTIONS}
          value={settings.calendarSystem}
          onChange={on('calendarSystem')}
          testID="settings-calendar"
        />
        <SettingsChoice
          label={SETTINGS_COPY.weekStartLabel}
          options={WEEK_START_OPTIONS}
          value={settings.weekStartsOn}
          onChange={on('weekStartsOn')}
          testID="settings-week-start"
        />
        <SettingsChoice
          label={SETTINGS_COPY.currencyDisplayLabel}
          options={CURRENCY_DISPLAY_OPTIONS}
          value={settings.currencyDisplay}
          onChange={on('currencyDisplay')}
          testID="settings-currency-display"
        />
        <SettingsChoice
          label={SETTINGS_COPY.dateFormatLabel}
          options={DATE_FORMAT_OPTIONS}
          value={settings.dateFormat}
          onChange={on('dateFormat')}
          testID="settings-date-format"
        />
        <SettingsChoice
          label={SETTINGS_COPY.timeFormatLabel}
          options={TIME_FORMAT_OPTIONS}
          value={settings.timeFormat}
          onChange={on('timeFormat')}
          testID="settings-time-format"
        />
        <SettingsChoice
          label={SETTINGS_COPY.nameOrderLabel}
          options={NAME_ORDER_OPTIONS}
          value={settings.firstNameOrder}
          onChange={on('firstNameOrder')}
          testID="settings-name-order"
        />
      </Stack>
      <ConfirmSheet
        open={confirmOpen}
        title="Reset language & region?"
        body="Locale, calendar and format preferences return to defaults."
        confirmLabel={SETTINGS_COPY.resetConfirmAction}
        onConfirm={confirmReset}
        onCancel={cancelReset}
      />
    </Screen>
  );
}

export default LanguageSection;
