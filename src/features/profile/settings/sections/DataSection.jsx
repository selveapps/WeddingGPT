import React, { useCallback, useState } from 'react';
import { Share } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen,
  Stack,
  Card,
  ScreenHeader,
  SectionHeader,
  Button,
  Text,
  TextField,
  ConfirmSheet,
  useToast,
} from '@/design-system/components';
import { useSettingsSection } from '../hooks/useSettings';
import { SettingsChoice } from '../components/SettingsChoice';
import { SettingsToggleRow } from '../components/SettingsToggleRow';
import { parseClampedInt, formatSettingsTimestamp } from '../lib/settingsHelpers';
import {
  SETTINGS_SECTIONS,
  SETTINGS_COPY,
  BACKUP_FREQUENCY_OPTIONS,
} from '../lib/settingsConstants';

export function DataSection() {
  const router = useRouter();
  const toast = useToast();
  const {
    settings,
    setSetting,
    markExport,
    markBackup,
    exportPayload,
    dirty,
    confirmOpen,
    requestReset,
    cancelReset,
    confirmReset,
  } = useSettingsSection(SETTINGS_SECTIONS.DATA);
  const save = useCallback(() => toast.success(SETTINGS_COPY.saveToast), [toast]);
  const [exportDays, setExportDays] = useState(String(settings.exportReminderDays));
  const [keepDays, setKeepDays] = useState(String(settings.keepDeletedItemsDays));

  const commitInt = (raw, setter, key, min, max) => {
    const result = parseClampedInt(raw, min, max, settings[key]);
    setSetting(key, result.value);
    setter(String(result.value));
    if (result.message) toast.info(result.message);
    else save();
  };

  const onExport = async () => {
    try {
      const payload = exportPayload({ version: '1.0.0' });
      const body = JSON.stringify(payload, null, 2);
      await Share.share({ message: body, title: 'WeddingGPT settings export' });
      markExport();
      toast.success('Settings exported');
    } catch {
      toast.error('Could not share export');
    }
  };

  const onBackupMark = () => {
    markBackup();
    toast.success('Backup timestamp updated');
  };

  return (
    <Screen testID="settings-data" edges={['top', 'bottom']}>
      <ScreenHeader
        title="Data & storage"
        onBack={() => router.back()}
        trailing={
          dirty ? (
            <Button variant="ghost" size="sm" onPress={requestReset} label={SETTINGS_COPY.resetSection} />
          ) : null
        }
      />
      <Stack gap="lg" style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <SectionHeader title="Backups" />
        <Card>
          <SettingsToggleRow
            label={SETTINGS_COPY.autoBackupLabel}
            value={settings.autoBackup}
            onValueChange={(v) => {
              setSetting('autoBackup', v);
              save();
            }}
            testID="settings-auto-backup"
          />
        </Card>
        <SettingsChoice
          label={SETTINGS_COPY.backupFrequencyLabel}
          options={BACKUP_FREQUENCY_OPTIONS}
          value={settings.backupFrequency}
          onChange={(v) => {
            setSetting('backupFrequency', v);
            save();
          }}
          testID="settings-backup-frequency"
        />
        <Card>
          <Stack gap="sm">
            <Text variant="caption" color="muted">
              Last backup: {formatSettingsTimestamp(settings.lastBackupAt, settings.locale)}
            </Text>
            <Text variant="caption" color="muted">
              Last export: {formatSettingsTimestamp(settings.lastExportAt, settings.locale)}
            </Text>
            <Button label="Export settings JSON" onPress={onExport} testID="settings-export-btn" />
            <Button label="Mark backup complete" variant="secondary" onPress={onBackupMark} />
          </Stack>
        </Card>

        <SectionHeader title="Reminders & retention" />
        <Card>
          <SettingsToggleRow
            label={SETTINGS_COPY.remindExportLabel}
            value={settings.remindToExport}
            onValueChange={(v) => {
              setSetting('remindToExport', v);
              save();
            }}
            testID="settings-remind-export"
          />
          <SettingsToggleRow
            label={SETTINGS_COPY.wifiOnlyLabel}
            value={settings.syncOnWifiOnly}
            onValueChange={(v) => {
              setSetting('syncOnWifiOnly', v);
              save();
            }}
            testID="settings-wifi-only"
          />
          <SettingsToggleRow
            label={SETTINGS_COPY.clearCacheLabel}
            value={settings.clearCacheOnLogout}
            onValueChange={(v) => {
              setSetting('clearCacheOnLogout', v);
              save();
            }}
            testID="settings-clear-cache"
          />
        </Card>
        <TextField
          label={SETTINGS_COPY.exportDaysLabel}
          value={exportDays}
          onChangeText={setExportDays}
          onBlur={() => commitInt(exportDays, setExportDays, 'exportReminderDays', 7, 365)}
          keyboardType="number-pad"
        />
        <TextField
          label={SETTINGS_COPY.keepDeletedLabel}
          value={keepDays}
          onChangeText={setKeepDays}
          onBlur={() => commitInt(keepDays, setKeepDays, 'keepDeletedItemsDays', 0, 90)}
          keyboardType="number-pad"
        />
      </Stack>
      <ConfirmSheet
        open={confirmOpen}
        title="Reset data settings?"
        body="Backup and retention preferences return to defaults. Existing data is kept."
        confirmLabel={SETTINGS_COPY.resetConfirmAction}
        onConfirm={confirmReset}
        onCancel={cancelReset}
      />
    </Screen>
  );
}

export default DataSection;
