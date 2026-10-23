import React, { useEffect, useState } from 'react';

import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmSheet,
  ListRow,
  SectionHeader,
  Stack,
  Text,
  useToast,
} from '@/design-system/components';
import { useAuthStore, selectAuthUser } from '@/store/authStore';
import { useWeddingStore, selectWedding } from '@/store/weddingStore';
import { workspaceLink } from '@/services/sync';
import { InviteSheet } from '@/features/home/InviteSheet';

import { inviteErrorMessage } from './syncStatus';

/**
 * Who plans this wedding (slice A5). The owner can invite a partner while
 * there is room and remove them; a partner can leave. Removal takes effect on
 * the partner's next sync, which returns their phone to its own wedding.
 */
export function MembersCard() {
  const toast = useToast();
  const me = useAuthStore(selectAuthUser);
  const wedding = useWeddingStore(selectWedding);
  const [state, setState] = useState({ status: 'loading', members: [] });
  const [attempt, setAttempt] = useState(0);
  const [inviting, setInviting] = useState(false);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    let cancelled = false;
    workspaceLink.listMembers().then(
      (members) => {
        if (!cancelled) setState({ status: 'ready', members });
      },
      () => {
        if (!cancelled) setState({ status: 'error', members: [] });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = () => setAttempt((n) => n + 1);
  const myRole = state.members.find((member) => member.userId === me?.id)?.role ?? null;
  const isOwner = myRole === 'owner';
  const hasRoom = state.members.length < 2;

  const run = async () => {
    const action = confirm;
    setConfirm(null);
    try {
      if (action.type === 'remove') {
        await workspaceLink.removePartner(action.member.userId);
        toast.success(`${action.member.name || 'Your partner'} was removed`);
        reload();
      } else {
        await workspaceLink.leaveShared(me.id);
        toast.info("You left the shared wedding. This phone's own plan is back.");
      }
    } catch (caught) {
      toast.error(inviteErrorMessage(caught?.code));
    }
  };

  return (
    <Stack gap="xs">
      <SectionHeader title="Planning together" />
      <Card padding="none">
        {state.status === 'loading' ? (
          <ListRow title="Loading…" showChevron={false} />
        ) : state.status === 'error' ? (
          <ListRow
            title="Could not load who is planning"
            subtitle="Tap to try again"
            icon="refresh"
            onPress={reload}
          />
        ) : (
          state.members.map((member) => (
            <ListRow
              key={member.userId}
              leading={<Avatar name={member.name || '?'} size="sm" />}
              title={
                member.userId === me?.id ? `${member.name || 'You'} (you)` : member.name || 'Your partner'
              }
              trailing={<Badge label={member.role === 'owner' ? 'Owner' : 'Partner'} tone="neutral" />}
              showChevron={false}
              onPress={
                isOwner && member.role === 'partner'
                  ? () => setConfirm({ type: 'remove', member })
                  : undefined
              }
              accessibilityHint={
                isOwner && member.role === 'partner' ? 'Remove from this wedding' : undefined
              }
            />
          ))
        )}
      </Card>

      {state.status === 'ready' && isOwner && hasRoom ? (
        <Button
          label="Invite your partner"
          iconLeft="userPlus"
          variant="secondary"
          onPress={() => setInviting(true)}
        />
      ) : null}
      {state.status === 'ready' && isOwner && !hasRoom ? (
        <Text variant="caption" color="subtle">
          Tap your partner to remove them from this wedding.
        </Text>
      ) : null}
      {state.status === 'ready' && myRole === 'partner' ? (
        <Button label="Leave this wedding" variant="ghost" onPress={() => setConfirm({ type: 'leave' })} />
      ) : null}

      <InviteSheet
        visible={inviting}
        onClose={() => setInviting(false)}
        ownerName={wedding?.ownerName}
        partnerName={wedding?.partnerName}
        onSent={() => setInviting(false)}
      />

      <ConfirmSheet
        visible={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={run}
        title={
          confirm?.type === 'remove'
            ? `Remove ${confirm.member.name || 'your partner'}?`
            : 'Leave this wedding?'
        }
        message={
          confirm?.type === 'remove'
            ? 'They will no longer see or change this wedding. Everything they added stays.'
            : 'You will no longer see this wedding. Your partner keeps it, and can invite you again.'
        }
        confirmLabel={confirm?.type === 'remove' ? 'Remove' : 'Leave'}
        destructive
      />
    </Stack>
  );
}

export default MembersCard;
