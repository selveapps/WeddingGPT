import React from 'react';

import {
  Stack,
  Text,
  Card,
  Button,
  SectionHeader,
  ConfirmSheet,
} from '@/design-system/components';

import { PROFILE_COPY } from '../lib/profileConstants';

/**
 * Destructive reset for the local workspace.
 *
 * Deliberately sunk to the bottom of the screen and wrapped in ConfirmSheet so
 * a scroll-thumb cannot wipe the wedding. Online backup is not available yet,
 * so the copy is explicit about what disappears.
 */
export function ProfileDangerZone({
  confirmOpen,
  onRequestReset,
  onCancelReset,
  onConfirmReset,
  style,
}) {
  return (
    <Stack gap="sm" style={style} testID="profile-danger-zone">
      <SectionHeader
        eyebrow={PROFILE_COPY.dangerEyebrow}
        title={PROFILE_COPY.dangerTitle}
        subtitle={PROFILE_COPY.dangerSubtitle}
      />

      <Card tone="danger">
        <Stack gap="md">
          <Text variant="bodySm" color="danger">
            Tasks, guests, budget figures and this profile all live on this device.
            Resetting clears them here. There is no cloud restore yet.
          </Text>
          <Button
            label={PROFILE_COPY.dangerButton}
            variant="danger"
            iconLeft="trash"
            onPress={onRequestReset}
          />
        </Stack>
      </Card>

      <ConfirmSheet
        visible={confirmOpen}
        onClose={onCancelReset}
        onConfirm={onConfirmReset}
        title={PROFILE_COPY.dangerConfirmTitle}
        message={PROFILE_COPY.dangerConfirmMessage}
        confirmLabel={PROFILE_COPY.dangerConfirmLabel}
        cancelLabel="Keep my wedding"
        destructive
        icon="trash"
      />
    </Stack>
  );
}

export default ProfileDangerZone;
