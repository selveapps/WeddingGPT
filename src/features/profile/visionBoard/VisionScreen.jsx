import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import { Screen, ScreenHeader, Stack, Text } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { useWeddingStore, selectWedding } from '@/store';

import { WeddingVisionBoard } from './WeddingVisionBoard';

/**
 * The vision board as its own screen (J1), so Planning can open it: before,
 * it lived only inside the profile, which no route shows.
 */
export function VisionScreen() {
  const { spacing } = useTheme();
  const wedding = useWeddingStore(selectWedding);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen bottomInset={spacing.xxl}>
        <Stack gap="lg">
          <ScreenHeader eyebrow="Planning" title="Vision board" />
          {wedding ? (
            <WeddingVisionBoard />
          ) : (
            <Text variant="body" color="muted">
              Set up your wedding first, then come back to collect ideas.
            </Text>
          )}
        </Stack>
      </Screen>
    </KeyboardAvoidingView>
  );
}

export default VisionScreen;
