import React, { useEffect, useState } from 'react';

import {
  Badge,
  Button,
  Card,
  ListRow,
  Row,
  SectionHeader,
  Stack,
  Text,
  useToast,
} from '@/design-system/components';
import {
  useSyncStore,
  selectConflicts,
  selectLastSyncError,
  selectLastSyncedAt,
  selectPendingCount,
  useWeddingStore,
  selectWedding,
} from '@/store';
import { coupleDisplayName } from '@/models';
import { syncEngine, workspaceLink } from '@/services/sync';
import { useActiveWorkspace } from './useActiveWorkspace';
import { MembersCard } from './MembersCard';
import { describeConflict, describeSyncStatus, syncErrorMessage } from './syncStatus';

/**
 * The Sync part of the Account screen, shown when signed in.
 *
 * On the phone's own wedding it offers to back it up (no wedding on the
 * account yet) or to open the account's wedding (D2 - the phone's own stays
 * as it is). On a synced wedding it shows the status, a Sync now button and
 * any conflicting edits, with the option to restore the other version.
 */
export function SyncSection() {
  const linked = useActiveWorkspace() !== 'local';
  return linked ? <LinkedSync /> : <UnlinkedSync />;
}

function UnlinkedSync() {
  const toast = useToast();
  const wedding = useWeddingStore(selectWedding);
  const lastError = useSyncStore(selectLastSyncError);
  const [state, setState] = useState({ status: 'loading', workspaces: [] });
  const [busy, setBusy] = useState(false);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    workspaceLink.listAccountWorkspaces().then(
      (workspaces) => {
        if (!cancelled) setState({ status: 'ready', workspaces });
      },
      () => {
        if (!cancelled) setState({ status: 'error', workspaces: [] });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = () => {
    setState({ status: 'loading', workspaces: [] });
    setAttempt((n) => n + 1);
  };

  const upload = async () => {
    setBusy(true);
    try {
      const { queued } = await workspaceLink.uploadThisWedding(coupleDisplayName(wedding) || 'Our wedding');
      toast.success(`Backed up and syncing - ${queued} ${queued === 1 ? 'item' : 'items'}`);
    } catch {
      toast.error('Could not back up your wedding. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const open = async (workspace) => {
    setBusy(true);
    try {
      await workspaceLink.openAccountWorkspace(workspace);
      toast.success(`Opened ${workspace.name}`);
    } catch {
      toast.error('Could not open that wedding. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack gap="xs">
      <SectionHeader title="Sync" />
      {lastError ? (
        <Card tone="sunken">
          <Text variant="bodySm" color="muted">
            {syncErrorMessage(lastError)}
          </Text>
        </Card>
      ) : null}

      {state.status === 'loading' ? (
        <Card>
          <Text variant="bodySm" color="muted">
            Checking your account…
          </Text>
        </Card>
      ) : null}

      {state.status === 'error' ? (
        <Card>
          <Stack gap="sm">
            <Text variant="bodySm" color="muted">
              Could not reach your account to check for a shared wedding.
            </Text>
            <Button label="Try again" variant="secondary" size="sm" fullWidth={false} onPress={retry} />
          </Stack>
        </Card>
      ) : null}

      {state.status === 'ready' && state.workspaces.length === 0 ? (
        <Card tone="accent">
          <Stack gap="sm">
            <Text variant="bodyStrong">Back up and sync this wedding</Text>
            <Text variant="bodySm" color="muted">
              Your plan is copied to your account and kept in sync, so it is safe if you lose this phone and
              ready for your partner to join.
            </Text>
            <Button label="Back up and sync" iconLeft="refresh" loading={busy} onPress={upload} />
          </Stack>
        </Card>
      ) : null}

      {state.status === 'ready' && state.workspaces.length > 0 ? (
        <Stack gap="xs">
          <Card padding="none">
            {state.workspaces.map((workspace) => (
              <ListRow
                key={workspace.id}
                icon="heart"
                title={`Open ${workspace.name}`}
                subtitle={workspace.role === 'owner' ? 'Your wedding on this account' : 'Shared with you'}
                disabled={busy}
                onPress={() => open(workspace)}
              />
            ))}
          </Card>
          <Text variant="caption" color="subtle">
            The wedding on this phone stays as it is. You will see it again if you sign out.
          </Text>
          <Button
            label="Back up this phone's wedding as a new one"
            variant="ghost"
            size="sm"
            disabled={busy}
            onPress={upload}
          />
        </Stack>
      ) : null}
    </Stack>
  );
}

function LinkedSync() {
  const toast = useToast();
  const pending = useSyncStore(selectPendingCount);
  const lastSyncedAt = useSyncStore(selectLastSyncedAt);
  const lastError = useSyncStore(selectLastSyncError);
  const conflicts = useSyncStore(selectConflicts);
  const dismissConflict = useSyncStore((state) => state.dismissConflict);
  const [syncing, setSyncing] = useState(false);

  const status = describeSyncStatus({ pending, lastSyncedAt, lastError });

  const syncNow = async () => {
    setSyncing(true);
    try {
      const result = await syncEngine.syncNow();
      if (result?.error) toast.info(syncErrorMessage(result.error));
      else toast.success('Up to date');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Stack gap="xs">
      <SectionHeader title="Sync" />
      <Card>
        <Stack gap="sm">
          <Row gap="sm" align="center">
            <Badge
              label={status.tone === 'success' ? 'Synced' : status.tone === 'warning' ? 'Paused' : 'Syncing'}
              tone={status.tone}
            />
            <Text variant="bodySm" color="muted" style={{ flex: 1 }}>
              {status.text}
            </Text>
          </Row>
          <Button
            label="Sync now"
            variant="secondary"
            size="sm"
            fullWidth={false}
            iconLeft="refresh"
            loading={syncing}
            onPress={syncNow}
          />
        </Stack>
      </Card>

      <MembersCard />

      {conflicts.length ? (
        <Stack gap="xs">
          <SectionHeader eyebrow="Edited on two phones" title="Check these changes" />
          {conflicts.map((conflict) => (
            <Card key={conflict.id}>
              <Stack gap="sm">
                <Text variant="bodySm">{describeConflict(conflict)}</Text>
                <Row gap="xs">
                  <Button
                    label="Restore the other version"
                    size="sm"
                    variant="secondary"
                    fullWidth={false}
                    onPress={() => {
                      if (syncEngine.restoreConflict(conflict)) toast.success('Restored');
                    }}
                  />
                  <Button
                    label="Keep mine"
                    size="sm"
                    variant="ghost"
                    fullWidth={false}
                    onPress={() => dismissConflict(conflict.id)}
                  />
                </Row>
              </Stack>
            </Card>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}

export default SyncSection;
