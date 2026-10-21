import React from 'react';
import { View } from 'react-native';

import {
  Stack,
  Row,
  Text,
  Card,
  Icon,
  Button,
  ConfirmSheet,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

import { PROFILE_COPY } from '../lib/profileConstants';

/**
 * Destructive reset for the local workspace.
 *
 * Sunk to the bottom of the screen in an outlined card with a small secondary
 * danger button, and always behind ConfirmSheet, so a scroll-thumb cannot
 * wipe the wedding. There is no online backup yet, so the copy is explicit.
 */
export function ProfileDangerZone({
  confirmOpen,
  onRequestReset,
  onCancelReset,
  onConfirmReset,
  style,
}) {
  const { colors, radii, borderWidths } = useTheme();

  return (
    <View style={style} testID="profile-danger-zone">
      <Card
        tone="plain"
        radius="xl"
        style={{ borderWidth: borderWidths.hairline, borderColor: colors.dangerSoft }}
      >
        <Stack gap="md">
          <Row gap="sm" align="flex-start">
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radii.sm,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.dangerSoft,
              }}
            >
              <Icon name="alert" size="sm" color="dangerSoftInk" />
            </View>
            <Stack gap="hair" style={{ flex: 1 }}>
              <Text variant="eyebrow" color="danger">
                {PROFILE_COPY.dangerEyebrow}
              </Text>
              <Text variant="bodyStrong">{PROFILE_COPY.dangerTitle}</Text>
              <Text variant="bodySm" color="muted">
                Tasks, guests, budget figures and this profile all live on this device.
                Resetting clears them here. There is no cloud restore yet.
              </Text>
            </Stack>
          </Row>
          <Button
            label={PROFILE_COPY.dangerButton}
            variant="danger"
            size="md"
            iconLeft="trash"
            onPress={onRequestReset}
            testID="profile-danger-reset"
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
    </View>
  );
}

export default ProfileDangerZone;
