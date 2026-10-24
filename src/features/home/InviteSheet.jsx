import React, { useState } from 'react';

import { BottomSheet, Button, Row, Stack, Text, TextField } from '@/design-system/components';
import { shareText } from '@/services/share';
import { workspaceLink } from '@/services/sync';

export function InviteSheet({ visible, onClose, ownerName, partnerName, onSent }) {
  if (!visible) return null;
  return (
    <InviteSheetForm
      key={partnerName || 'unset'}
      onClose={onClose}
      ownerName={ownerName}
      partnerName={partnerName}
      onSent={onSent}
    />
  );
}

function InviteSheetForm({ onClose, ownerName, partnerName, onSent }) {
  const [name, setName] = useState(partnerName || '');
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);
  const sendInvite = async () => {
    setSharing(true);
    setError('');
    try {
      const invite = await workspaceLink.createInviteLink();
      if (!invite?.url) throw new Error('The invite service did not return a link.');

      const shared = await shareText(
        `${ownerName || 'I'} invited you to plan our wedding together: ${invite.url}`,
        'Join our wedding'
      );
      if (!shared) {
        setError('Could not open the share sheet. Please try again on a device that supports sharing.');
        return;
      }
      onSent({ partnerName: name.trim() || null });
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Could not create an invite link.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title="Invite your partner"
      subtitle="Create a secure link and share it with the person planning alongside you."
      footer={
        <Row gap="xs">
          <Button label="Cancel" variant="secondary" style={{ flex: 1 }} onPress={onClose} />
          <Button
            label="Create and share link"
            style={{ flex: 1 }}
            onPress={sendInvite}
            loading={sharing}
            disabled={sharing}
          />
        </Row>
      }
    >
      <Stack gap="md">
        <TextField
          label="Partner's name"
          value={name}
          onChangeText={setName}
          placeholder="Their name"
          autoCapitalize="words"
          autoCorrect={false}
        />
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
