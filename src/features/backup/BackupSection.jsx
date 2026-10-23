import React, { useState } from 'react';

import {
  BottomSheet,
  Button,
  Card,
  ListRow,
  Row,
  SectionHeader,
  Stack,
  Text,
  TextField,
  useToast,
} from '@/design-system/components';
import { formatMediumDate, toISODate } from '@/lib/date';
import { CAN_PICK_FILES, datedFilename, exportTextFile, pickTextFile } from '@/services/files';

import { canRestoreHere, checkBackup, createBackupText, restoreBackup } from './backupService';

/**
 * Back up the plan on this phone, and restore it (graduated from Labs).
 * Works without an account: for a couple who never signs in, this file is
 * the only copy that is not on the phone.
 */
export function BackupSection() {
  const toast = useToast();
  const [restoring, setRestoring] = useState(false);

  const backUp = async () => {
    const result = await exportTextFile({
      filename: datedFilename('weddinggpt-backup', 'json'),
      text: createBackupText(),
      mimeType: 'application/json',
      title: 'WeddingGPT backup',
    });
    if (result === 'downloaded') toast.success('Backup downloaded. Keep it somewhere safe.');
    else if (result === 'failed') toast.error('Could not save the backup');
    return result;
  };

  return (
    <Stack gap="xs">
      <SectionHeader title="Backup" subtitle="Everything you have planned, in one file." />
      <Card padding="none">
        <ListRow
          icon="send"
          title="Back up this phone's plan"
          subtitle="Download a backup file"
          onPress={backUp}
        />
        <ListRow
          icon="refresh"
          title="Restore from a backup"
          subtitle="Replace this phone's plan with a backup"
          onPress={() => setRestoring(true)}
        />
      </Card>
      {restoring ? <RestoreSheet onBackUp={backUp} onClose={() => setRestoring(false)} /> : null}
    </Stack>
  );
}

function RestoreSheet({ onBackUp, onClose }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [checked, setChecked] = useState(null);

  const check = (value) => {
    setText(value);
    setChecked(value.trim() ? checkBackup(value) : null);
  };

  const choose = async () => {
    const picked = await pickTextFile({ accept: '.json,application/json' });
    if (!picked) return;
    if (picked.error) {
      toast.error(
        picked.error === 'too_large'
          ? 'That file is too large to be a backup.'
          : 'That file could not be read.'
      );
      return;
    }
    check(picked.text);
  };

  const restore = () => {
    const records = restoreBackup(checked);
    onClose();
    toast.success(`Restored ${records} ${records === 1 ? 'record' : 'records'} from the backup`);
  };

  if (!canRestoreHere()) {
    return (
      <BottomSheet
        visible
        onClose={onClose}
        title="Restore from a backup"
        footer={<Button label="Close" variant="secondary" onPress={onClose} />}
      >
        <Text variant="body" color="muted">
          This phone is showing your synced wedding, which your account keeps safe. A backup restores the
          phone’s own plan: sign out first, then restore it here.
        </Text>
      </BottomSheet>
    );
  }

  const shown = checked?.ok ? checked.counts.filter((entry) => entry.count > 0) : [];

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title="Restore from a backup"
      subtitle="The backup replaces everything planned on this phone."
      footer={
        <Stack gap="xs">
          <Button
            label="Replace my plan with this backup"
            variant="danger"
            disabled={!checked?.ok}
            onPress={restore}
          />
          <Button label="Back up what is here first" variant="secondary" onPress={onBackUp} />
        </Stack>
      }
    >
      <Stack gap="md">
        {CAN_PICK_FILES ? (
          <Button label="Choose a backup file" variant="secondary" iconLeft="note" onPress={choose} />
        ) : null}
        <TextField
          label={CAN_PICK_FILES ? 'Or paste the backup' : 'Paste the backup'}
          value={text}
          onChangeText={check}
          multiline
          numberOfLines={4}
          autoCapitalize="none"
          error={checked && !checked.ok ? checked.error : undefined}
        />
        {checked?.ok ? (
          <Card tone="muted">
            <Stack gap="xs">
              <Text variant="bodyStrong">
                {checked.createdAt
                  ? `Backup from ${formatMediumDate(toISODate(new Date(checked.createdAt)))}`
                  : 'Backup'}
              </Text>
              {shown.map((entry) => (
                <Row key={entry.collection} justify="space-between">
                  <Text variant="bodySm">{entry.label}</Text>
                  <Text variant="bodySm" color="muted">
                    {entry.count}
                  </Text>
                </Row>
              ))}
            </Stack>
          </Card>
        ) : null}
      </Stack>
    </BottomSheet>
  );
}

export default BackupSection;
