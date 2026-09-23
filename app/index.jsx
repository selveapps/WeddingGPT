import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '@/design-system/theme';
import { Text, LoadingState, Icon, Stack } from '@/design-system/components';
import { useStoreHydration, useWeddingStore, selectHasCompletedOnboarding } from '@/store';
import { Routes } from '@/navigation/routes';

/**
 * Launch gate.
 *
 * Holds the first frame until persisted state has rehydrated, then routes to
 * either onboarding or the workspace. This is the screen that makes the
 * difference between a returning user seeing their wedding and seeing an empty
 * app for half a second - see `useStoreHydration` for why that matters.
 *
 * `replace` rather than `push`: the gate must not sit in the back stack, or the
 * Android back button from Home would land here and bounce forward again.
 */
export default function LaunchScreen() {
  const router = useRouter();
  const { colors, spacing } = useTheme();

  const hydrated = useStoreHydration();
  const hasOnboarded = useWeddingStore(selectHasCompletedOnboarding);

  useEffect(() => {
    if (!hydrated) return;

    // A couple who has not finished onboarding goes to onboarding, which itself
    // resumes at whichever question they stopped on (PRD s.4.3). Everyone else
    // goes straight to their workspace.
    router.replace(hasOnboarded ? Routes.home : Routes.onboarding);
  }, [hydrated, hasOnboarded, router]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.canvas,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
      }}
    >
      <Stack gap="sm" align="center">
        <Icon name="rings" size={56} color="brand" />
        <Text variant="h1" heading>
          WeddingGPT
        </Text>
      </Stack>
      <LoadingState message={hydrated ? 'Opening your workspace...' : 'Gathering your plans...'} />
    </View>
  );
}
