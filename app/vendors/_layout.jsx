import React from 'react';
import { Stack } from 'expo-router';

import { useTheme } from '@/design-system/theme';

/** Vendors stack. Screens draw their own `ScreenHeader`. */
export default function VendorsStackLayout() {
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
