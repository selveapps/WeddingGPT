import React, { useEffect, useState } from 'react';
import { Share } from 'react-native';

import { BottomSheet, Button, Stack, Text, TextField } from '@/design-system/components';
import { analytics, AnalyticsEvents } from '@/services/analytics';

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
 * needs no account system to work today. `onSent` fires only when the share
 * sheet reports the message actually went somewhere.
 */
export function InviteSheet({ visible, onClose, ownerName, partnerName, onSent }) {
  const [name, setName] = useState(partnerName ?? '');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (visible) setName(partnerName ?? '');
  }, [visible, partnerName]);

  const send = async () => {
    const theirs = name.trim();
    const mine = ownerName?.trim();
    const message = [
      `${theirs ? `Hi ${theirs}! ` : ''}${mine ? `It's ${mine} - ` : ''}I'm planning our wedding in WeddingGPT. Come plan it with me: our checklist, budget and guest list, all in one place.`,
      INVITE_URL,
    ]
      .filter(Boolean)
      .join('\n\n');

    setSharing(true);
    try {
      const result = await Share.share({ message, url: INVITE_URL ?? undefined });
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
      </Stack>
    </BottomSheet>
  );
}

export default InviteSheet;
