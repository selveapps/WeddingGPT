import React from 'react';
import { Stack } from 'expo-router';

import { useTheme } from '@/design-system/theme';

/**
 * Onboarding stack.
 *
 * Headers are off: each step draws its own progress indicator and back control,
 * because a stock title bar would sit exactly where the PRD wants the large
 * question to be (s.4.1).
 */
export default function OnboardingLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
        animation: 'slide_from_right',
        // The generated plan is an arrival, not another question - and there is
        // nothing to go back to once the wedding has been created.
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[step]" />
      <Stack.Screen name="plan" options={{ animation: 'fade', gestureEnabled: false }} />
    </Stack>
  );
}
