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
  AI_STYLE_OPTIONS,
  AI_TONE_OPTIONS,
} from '../lib/settingsConstants';

export function AISection() {
  const router = useRouter();
  const toast = useToast();
  const { settings, setSetting, dirty, confirmOpen, requestReset, cancelReset, confirmReset } =
    useSettingsSection(SETTINGS_SECTIONS.AI);
  const save = useCallback(() => toast.success(SETTINGS_COPY.saveToast), [toast]);
  const [maxText, setMaxText] = useState(String(settings.aiMaxSuggestionsPerDay));

  const on = (key) => (v) => {
    setSetting(key, v);
    save();
  };

  const commitMax = () => {
    const result = parseClampedInt(maxText, 0, 50, settings.aiMaxSuggestionsPerDay);
    setSetting('aiMaxSuggestionsPerDay', result.value);
    setMaxText(String(result.value));
    if (result.message) toast.info(result.message);
    else save();
  };

  return (
    <Screen testID="settings-ai" edges={['top', 'bottom']}>
      <ScreenHeader
        title="AI assistant"
        onBack={() => router.back()}
        trailing={
          dirty ? (
            <Button variant="ghost" size="sm" onPress={requestReset} label={SETTINGS_COPY.resetSection} />
          ) : null
        }
      />
      <Stack gap="lg" style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <SettingsChoice
          label={SETTINGS_COPY.aiStyleLabel}
          options={AI_STYLE_OPTIONS}
          value={settings.aiStyle}
          onChange={on('aiStyle')}
          testID="settings-ai-style"
        />
        <SettingsChoice
          label={SETTINGS_COPY.aiToneLabel}
          options={AI_TONE_OPTIONS}
          value={settings.aiTone}
          onChange={on('aiTone')}
          testID="settings-ai-tone"
        />
        <Card>
          <SettingsToggleRow
            label={SETTINGS_COPY.aiProactiveLabel}
            value={settings.aiSuggestProactively}
            onValueChange={(v) => {
              setSetting('aiSuggestProactively', v);
              save();
            }}
            testID="settings-ai-proactive"
          />
          <SettingsToggleRow
            label={SETTINGS_COPY.aiContextLabel}
            value={settings.aiUseWeddingContext}
            onValueChange={(v) => {
              setSetting('aiUseWeddingContext', v);
              save();
            }}
            testID="settings-ai-context"
          />
          <SettingsToggleRow
            label={SETTINGS_COPY.aiRememberLabel}
            value={settings.aiRememberPreferences}
            onValueChange={(v) => {
              setSetting('aiRememberPreferences', v);
              save();
            }}
            testID="settings-ai-remember"
          />
          <SettingsToggleRow
            label={SETTINGS_COPY.aiLocalLabel}
            value={settings.aiPreferLocalVendors}
            onValueChange={(v) => {
              setSetting('aiPreferLocalVendors', v);
              save();
            }}
            testID="settings-ai-local"
          />
        </Card>
        <TextField
          label={SETTINGS_COPY.aiMaxLabel}
          value={maxText}
          onChangeText={setMaxText}
          onBlur={commitMax}
          keyboardType="number-pad"
          testID="settings-ai-max"
        />
      </Stack>
      <ConfirmSheet
        open={confirmOpen}
        title="Reset AI settings?"
        body="Style, tone and suggestion limits return to defaults."
        confirmLabel={SETTINGS_COPY.resetConfirmAction}
        onConfirm={confirmReset}
        onCancel={cancelReset}
      />
    </Screen>
  );
}

export default AISection;
