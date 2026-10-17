import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '@/design-system/theme';
import { LoadingState, ErrorState } from '@/design-system/components';
import { BrandIntro } from '@/features/launch/BrandIntro';
import {
  useStoreHydration,
  useWeddingStore,
  selectHasCompletedOnboarding,
  rehydrateAllStores,
} from '@/store';
import { Routes } from '@/navigation/routes';
import { analytics, AnalyticsEvents } from '@/services/analytics';

/**
 * How long to wait for persisted state before calling it a failure. Rehydrating
 * a local workspace takes milliseconds; eight seconds means storage is broken,
 * not slow.
 */
const HYDRATION_TIMEOUT_MS = 8000;

/**
 * Launch gate (PRD s.3.1).
 *
 * Plays the brand intro while persisted state rehydrates underneath it, then
 * routes once both have finished:
 *
 *   no wedding yet -> onboarding (which resumes at the right question, and
 *                     can be skipped straight to a working dashboard)
 *   otherwise      -> the dashboard
 *
 * There is no sign-in: the workspace lives on the device, and an account can
 * be offered later as a way to back it up, not as a gate in front of it.
 *
 * The intro doubles as the loading state: hydration normally finishes long
 * before the animation does, so the couple sees the brand, not a spinner. If it
 * does not, a quiet loading line appears under the wordmark, and past the
 * timeout an error with Retry replaces it. There is no dead end.
 *
 * `replace` rather than `push`: the gate must not sit in the back stack, or the
 * Android back button from Home would land here and bounce forward again.
 */
export default function LaunchScreen() {
  const router = useRouter();
  const { colors, spacing } = useTheme();

  const hydrated = useStoreHydration();
  const hasOnboarded = useWeddingStore(selectHasCompletedOnboarding);

  const [introDone, setIntroDone] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (hydrated) return undefined;
    const timer = setTimeout(() => {
      setTimedOut(true);
      analytics.track(AnalyticsEvents.LAUNCH_FAILED, { reason: 'hydration_timeout' });
    }, HYDRATION_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [hydrated, retrying]);

  useEffect(() => {
    if (!hydrated || !introDone) return;
    router.replace(hasOnboarded ? Routes.home : Routes.onboarding);
  }, [hydrated, introDone, hasOnboarded, router]);

  const handleIntroFinish = useCallback(({ skipped }) => {
    if (skipped) analytics.track(AnalyticsEvents.INTRO_SKIPPED);
    setIntroDone(true);
  }, []);

  const retry = useCallback(async () => {
    setRetrying(true);
    setTimedOut(false);
    await rehydrateAllStores();
    setRetrying(false);
  }, []);

  if (timedOut && !hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, justifyContent: 'center', padding: spacing.lg }}>
        <ErrorState
          title="We could not open your workspace"
          message="Your plans are still saved on this device - something stopped us reading them just now. Trying again usually does it."
          onRetry={retry}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <BrandIntro
        onFinish={handleIntroFinish}
        footer={introDone && !hydrated ? <LoadingState message="Gathering your plans..." /> : null}
      />
    </View>
  );
}
