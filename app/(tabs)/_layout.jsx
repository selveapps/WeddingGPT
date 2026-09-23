import React from 'react';
import { Tabs } from 'expo-router';

import { TabBar } from '@/navigation/TabBar';
import { useTheme } from '@/design-system/theme';

/**
 * The five-tab application shell (PRD s.5).
 *
 * `tabBar` is overridden with our own component - see TabBar for why. Headers
 * are off everywhere: each screen draws its own, because the dashboard needs a
 * greeting and a countdown where a stock title bar would go.
 */
export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="planning" options={{ title: 'Planning' }} />
      <Tabs.Screen name="guests" options={{ title: 'Guests' }} />
      <Tabs.Screen name="budget" options={{ title: 'Budget' }} />
      <Tabs.Screen name="ai" options={{ title: 'Assistant' }} />
    </Tabs>
  );
}
