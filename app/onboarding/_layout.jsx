import React from 'react';
import { Stack } from 'expo-router';

import { useTheme } from '@/design-system/theme';

/**
 * Onboarding stack: the journey itself (one screen that steps internally) and
 * the plan reveal it hands over to. Headers are off - the journey draws its own
 * progress, back and skip controls.
 */
export default function OnboardingLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      {/* The plan is an arrival, not another question - and there is nothing to
          go back to once the wedding has been created. */}
      <Stack.Screen name="plan" options={{ animation: 'fade', gestureEnabled: false }} />
    </Stack>
  );
}
