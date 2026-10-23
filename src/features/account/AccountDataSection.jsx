import React, { useState } from 'react';

import {
  BottomSheet,
  Button,
  Card,
  ListRow,
  SectionHeader,
  Stack,
  Text,
  TextField,
  useToast,
} from '@/design-system/components';
import { useAuthStore } from '@/store';
import { AUTH_ERROR_MESSAGES, AuthErrorCode } from '@/services/auth';
import { datedFilename, exportTextFile } from '@/services/files';
import { workspaceLink } from '@/services/sync';

/**
 * Your data (slice A7): download everything the server holds for this
 * account, or delete the account for good.
 *
 * Deleting asks for the password again, so a phone left unlocked cannot erase
 * an account. Weddings shared with a partner pass to them; weddings only this
 * person is in are deleted on the server. The phone's own plan is not touched.
 */
export function AccountDataSection() {
  const toast = useToast();
  const exportAccount = useAuthStore((state) => state.exportAccount);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const download = async () => {
    setExporting(true);
    try {
      const data = await exportAccount();
      const result = await exportTextFile({
        filename: datedFilename('weddinggpt-account', 'json'),
        text: JSON.stringify(data, null, 2),
        mimeType: 'application/json',
        title: 'Your WeddingGPT data',
      });
      if (result === 'downloaded') toast.success('Your data is downloaded');
      else if (result === 'failed') toast.error('Could not save the file');
    } catch (error) {
      toast.error(AUTH_ERROR_MESSAGES[error?.code] ?? AUTH_ERROR_MESSAGES[AuthErrorCode.UNAVAILABLE]);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Stack gap="xs">
      <SectionHeader title="Your data" />
      <Card padding="none">
        <ListRow
          icon="send"
          title={exporting ? 'Preparing your data...' : 'Export my data'}
          subtitle="Your account and every wedding you are in, as a file"
          disabled={exporting}
          onPress={download}
        />
        <ListRow
          icon="trash"
          title="Delete my account"
          subtitle="For good. Shared weddings pass to your partner."
          destructive
          onPress={() => setDeleting(true)}
        />
      </Card>
      {deleting ? <DeleteAccountSheet onClose={() => setDeleting(false)} /> : null}
    </Stack>
  );
}

function DeleteAccountSheet({ onClose }) {
  const toast = useToast();
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteAccount(password);
    } catch (failure) {
      setBusy(false);
      setError(
        failure?.code === AuthErrorCode.INVALID_CREDENTIALS
          ? 'That password is not right. Nothing was deleted.'
          : (AUTH_ERROR_MESSAGES[failure?.code] ?? AUTH_ERROR_MESSAGES[AuthErrorCode.UNAVAILABLE])
      );
      return;
    }
    // The account is gone; take the synced wedding's copy off this phone too.
    if (workspaceLink.isLinked()) await workspaceLink.leave();
    onClose();
    toast.info('Your account is deleted. This phone’s own plan is still here.');
  };

  return (
    <BottomSheet
      visible
      onClose={busy ? () => {} : onClose}
      dismissible={!busy}
      title="Delete your account?"
      footer={
        <Stack gap="xs">
          <Button
            label="Delete my account"
            variant="danger"
            loading={busy}
            disabled={!password}
            onPress={confirm}
          />
          <Button label="Keep my account" variant="ghost" disabled={busy} onPress={onClose} />
        </Stack>
      }
    >
      <Stack gap="md">
        <Stack gap="xs">
          <Text variant="body">This cannot be undone.</Text>
          <Text variant="bodySm" color="muted">
            - Weddings you share with a partner pass to them, with everything in them.
          </Text>
          <Text variant="bodySm" color="muted">
            - Weddings only you are in are deleted from our server: guests, tasks, costs, RSVP links and the
            website.
          </Text>
          <Text variant="bodySm" color="muted">
            - The plan saved on this phone is not touched. Export your data first if you want a copy.
          </Text>
        </Stack>
        <TextField
          label="Your password"
          value={password}
          onChangeText={(next) => {
            setPassword(next);
            if (error) setError(null);
          }}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          error={error ?? undefined}
        />
      </Stack>
    </BottomSheet>
  );
}

export default AccountDataSection;
