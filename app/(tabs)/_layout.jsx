import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';

import { TabBar } from '@/navigation/TabBar';
import { useTheme } from '@/design-system/theme';
import { useReminderSync } from '@/features/notifications/useReminderSync';
import { InboxPeek } from '@/features/notifications/InboxPeek';

/**
 * The five-tab application shell (PRD s.5).
 *
 * `tabBar` is overridden with our own component - see TabBar for why. Headers
 * are off everywhere: each screen draws its own, because the dashboard needs a
 * greeting and a countdown where a stock title bar would go.
 *
 * This is the shell a couple reaches once onboarding is behind them, so it is
 * also where the in-app "coming up" peek lives.
 *
 * Switching tabs is instant, with the content already drawn:
 *
 *  - Every tab is mounted up front (`lazy: false`), so even the first visit
 *    to a tab shows its content immediately rather than building it then.
 *  - There is no scene animation. An earlier cross-fade kept the incoming tab
 *    transparent for the first half of the switch (it looked like data loading
 *    slowly), and on the new architecture a re-attached tab could keep a stale
 *    opacity of 0 from an interrupted fade and show up blank. The tab bar's
 *    gliding pill is the motion now.
 *  - Hidden tabs are frozen (`freezeOnBlur`), so ticking a task off on one tab
 *    does not re-render the other four in the background. A frozen tab catches
 *    up with any changes the moment it is shown again.
 */
export default function TabsLayout() {
  const { colors } = useTheme();

  useReminderSync();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        initialRouteName="home"
        screenOptions={{
          headerShown: false,
          lazy: false,
          freezeOnBlur: true,
          animation: 'none',
          sceneStyle: { backgroundColor: colors.canvas },
        }}
      >
        {/* The assistant leads the bar: chatting is the quickest way in. */}
        <Tabs.Screen name="ai" options={{ title: 'Assistant' }} />
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="planning" options={{ title: 'Planning' }} />
        <Tabs.Screen name="guests" options={{ title: 'Guests' }} />
        <Tabs.Screen name="budget" options={{ title: 'Budget' }} />
      </Tabs>

      {/* The "what's coming up" card that slides in at the top-right on open. */}
      <InboxPeek />
    </View>
  );
}
