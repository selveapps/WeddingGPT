import React from 'react';
import { Stack } from 'expo-router';

import { useTheme } from '@/design-system/theme';

/** Assistant conversations. Pushed over the tabs, so the chat gets the full height. */
export default function AssistantLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
        animation: 'slide_from_right',
      }}
    />
  );
}
