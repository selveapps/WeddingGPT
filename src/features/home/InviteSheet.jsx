import React, { useEffect, useState } from 'react';
import { Share } from 'react-native';

import { BottomSheet, Button, Stack, Text, TextField } from '@/design-system/components';
import { analytics, AnalyticsEvents } from '@/services/analytics';
import { isSyncConfigured, workspaceLink } from '@/services/sync';
import { useAuthStore, selectIsSignedIn } from '@/store/authStore';
import { useActiveWorkspace } from '@/features/sync/useActiveWorkspace';
import { inviteErrorMessage } from '@/features/sync/syncStatus';

/**
 * Where the invite points. Set `EXPO_PUBLIC_INVITE_URL` to the App Store /
 * Play Store listing (or a landing page) once there is one; until then the
 * invite goes out without a link.
 */
const INVITE_URL = process.env.EXPO_PUBLIC_INVITE_URL || null;

/**
 * Invite your partner to plan together.
 *
 * Onboarding only asks for the couple's own name, so this is where the
 * partner's name is captured. The invite itself goes out through the native
 * share sheet - text, WhatsApp, email, whatever the couple already uses - so it
 * needs no account system to work.
 *
 * When the wedding is synced to an account, the message also carries a join
 * link (slice A5) that opens the shared wedding on the partner's phone.
 * `onSent` fires only when the share sheet reports the message actually went
 * somewhere.
 */
export function InviteSheet({ visible, onClose, ownerName, partnerName, onSent }) {
  const [name, setName] = useState(partnerName ?? '');
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState(null);
  const signedIn = useAuthStore(selectIsSignedIn);
  const linked = useActiveWorkspace() !== 'local';
  const withJoinLink = isSyncConfigured && signedIn && linked;

  useEffect(() => {
    if (visible) setName(partnerName ?? '');
  }, [visible, partnerName]);

  const send = async () => {
    const theirs = name.trim();
    const mine = ownerName?.trim();
    setSharing(true);
    setError(null);
    try {
      let link = null;
      if (withJoinLink) {
        try {
          link = (await workspaceLink.createInviteLink()).url;
        } catch (caught) {
          setError(inviteErrorMessage(caught?.code));
          return;
        }
      }
      const message = [
        `${theirs ? `Hi ${theirs}! ` : ''}${mine ? `It's ${mine} - ` : ''}I'm planning our wedding in WeddingGPT. Come plan it with me: our checklist, budget and guest list, all in one place.`,
        link ? `Tap to join (the link works once, for 7 days): ${link}` : INVITE_URL,
      ]
        .filter(Boolean)
        .join('\n\n');

      const result = await Share.share({ message, url: link ?? INVITE_URL ?? undefined });
      if (result.action === Share.dismissedAction) return;
      analytics.track(AnalyticsEvents.PARTNER_INVITED, { hasName: Boolean(theirs) });
      onSent?.({ partnerName: theirs });
    } catch {
      // The share sheet failing to open is rare and not worth a dead end -
      // leave the sheet open so they can try again.
    } finally {
      setSharing(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Plan together"
      subtitle="Send your partner an invite by text, WhatsApp or email."
      footer={<Button label="Send invite" iconRight="send" loading={sharing} onPress={send} />}
    >
      <Stack gap="sm">
        <TextField
          label="Your partner's first name"
          value={name}
          onChangeText={setName}
          placeholder="Optional"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="send"
          onSubmitEditing={send}
        />
        <Text variant="caption" color="muted">
          We will add their name to your dashboard too.
        </Text>
        {isSyncConfigured && !withJoinLink ? (
          <Text variant="caption" color="subtle">
            To plan the same wedding on both phones, sign in and back up this wedding in Account first. The
            invite will then include a link that opens it.
          </Text>
        ) : null}
        {error ? (
          <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
      </Stack>
    </BottomSheet>
  );
}

export default InviteSheet;
