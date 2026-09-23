import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme, appFonts } from '@/design-system/theme';
import { ToastProvider } from '@/design-system/components';
import { analytics, AnalyticsEvents } from '@/services/analytics';

// Hold the native splash until fonts are ready, so the first frame the user
// sees is already branded rather than a flash of fallback type.
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Navigation host. Lives inside ThemeProvider so the stack background matches
 * the active scheme - without this the canvas flashes white on every push in
 * dark mode.
 */
function RootNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.canvas },
          animation: 'slide_from_right',
        }}
      />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(appFonts);
  const [splashHidden, setSplashHidden] = useState(false);

  // A font failure must not strand the user on the splash screen forever - we
  // render with system fallbacks instead and carry on.
  const ready = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (fontError && __DEV__) {
      console.warn('[fonts] Failed to load brand fonts, using system fallbacks.', fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if (ready) analytics.track(AnalyticsEvents.APP_OPENED);
  }, [ready]);

  const onLayoutRootView = useCallback(async () => {
    if (ready && !splashHidden) {
      setSplashHidden(true);
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready, splashHidden]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          {/* Inside ThemeProvider so toasts pick up theme colours, and outside
              the navigator so they survive route changes. */}
          <ToastProvider>
            <RootNavigator />
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
