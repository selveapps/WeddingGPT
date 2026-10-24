import React, { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Screen,
  Stack,
  Card,
  ScreenHeader,
  Button,
  TextField,
  ConfirmSheet,
  useToast,
} from '@/design-system/components';
import { useSettingsSection } from '../hooks/useSettings';
import { SettingsChoice } from '../components/SettingsChoice';
import { SettingsToggleRow } from '../components/SettingsToggleRow';
import { parseClampedInt } from '../lib/settingsHelpers';
import {
  SETTINGS_SECTIONS,
  SETTINGS_COPY,
  GUEST_VISIBILITY_OPTIONS,
} from '../lib/settingsConstants';

export function WeddingDefaultsSection() {
  const router = useRouter();
  const toast = useToast();
  const { settings, setSetting, dirty, confirmOpen, requestReset, cancelReset, confirmReset } =
    useSettingsSection(SETTINGS_SECTIONS.WEDDING_DEFAULTS);
  const save = useCallback(() => toast.success(SETTINGS_COPY.saveToast), [toast]);
  const [rsvp, setRsvp] = useState(String(settings.defaultRsvpWindowDays));
  const [lead, setLead] = useState(String(settings.defaultTaskLeadDays));
  const [pack, setPack] = useState(String(settings.packingListReminderDays));

  const commit = (raw, setter, key, min, max) => {
    const result = parseClampedInt(raw, min, max, settings[key]);
    setSetting(key, result.value);
    setter(String(result.value));
    if (result.message) toast.info(result.message);
    else save();
  };

  return (
    <Screen testID="settings-wedding-defaults" edges={['top', 'bottom']}>
      <ScreenHeader
        title="Wedding defaults"
        onBack={() => router.back()}
        trailing={
          dirty ? (
            <Button variant="ghost" size="sm" onPress={requestReset} label={SETTINGS_COPY.resetSection} />
          ) : null
        }
      />
      <Stack gap="lg" style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <TextField
          label={SETTINGS_COPY.rsvpWindowLabel}
          value={rsvp}
          onChangeText={setRsvp}
          onBlur={() => commit(rsvp, setRsvp, 'defaultRsvpWindowDays', 3, 90)}
          keyboardType="number-pad"
        />
        <TextField
          label={SETTINGS_COPY.taskLeadLabel}
          value={lead}
          onChangeText={setLead}
          onBlur={() => commit(lead, setLead, 'defaultTaskLeadDays', 1, 120)}
          keyboardType="number-pad"
        />
        <TextField
          label={SETTINGS_COPY.packingReminderLabel}
          value={pack}
          onChangeText={setPack}
          onBlur={() => commit(pack, setPack, 'packingListReminderDays', 1, 30)}
          keyboardType="number-pad"
        />
        <SettingsChoice
          label={SETTINGS_COPY.guestVisibilityLabel}
          options={GUEST_VISIBILITY_OPTIONS}
          value={settings.defaultGuestVisibility}
          onChange={(v) => {
            setSetting('defaultGuestVisibility', v);
            save();
          }}
          testID="settings-default-guest-vis"
        />
        <Card>
          <SettingsToggleRow
            label={SETTINGS_COPY.mealChoiceLabel}
            value={settings.requireMealChoice}
            onValueChange={(v) => {
              setSetting('requireMealChoice', v);
              save();
            }}
            testID="settings-require-meal"
          />
          <SettingsToggleRow
            label={SETTINGS_COPY.plusOneLabel}
            value={settings.requirePlusOneDecision}
            onValueChange={(v) => {
              setSetting('requirePlusOneDecision', v);
              save();
            }}
            testID="settings-require-plus-one"
          />
          <SettingsToggleRow
            label={SETTINGS_COPY.showBudgetHomeLabel}
            value={settings.showBudgetOnHome}
            onValueChange={(v) => {
              setSetting('showBudgetOnHome', v);
              save();
            }}
            testID="settings-show-budget-home"
          />
          <SettingsToggleRow
            label={SETTINGS_COPY.showCountdownHomeLabel}
            value={settings.showCountdownOnHome}
            onValueChange={(v) => {
              setSetting('showCountdownOnHome', v);
              save();
            }}
            testID="settings-show-countdown-home"
          />
        </Card>
      </Stack>
      <ConfirmSheet
        open={confirmOpen}
        title="Reset wedding defaults?"
        body="RSVP windows, meal rules and home cards return to defaults."
        confirmLabel={SETTINGS_COPY.resetConfirmAction}
        onConfirm={confirmReset}
        onCancel={cancelReset}
      />
    </Screen>
  );
}

export default WeddingDefaultsSection;
