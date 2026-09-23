import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';

import {
  schemes,
  textVariants,
  spacing,
  radii,
  shadows,
  durations,
  springs,
  easings,
  pressScale,
  pressOpacity,
  layout,
  controlHeights,
  iconSizes,
  avatarSizes,
  borderWidths,
  minTouchTarget,
  fontFamilies,
} from '../tokens';
import { storage, StorageKeys } from '../../services/storage';

/**
 * ThemeProvider.
 *
 * Owns three cross-cutting concerns that every component needs and no component
 * should re-derive:
 *
 *  1. Which colour scheme is active (user preference, falling back to the OS).
 *  2. Whether the OS has Reduce Motion on - surfaced as `reduceMotion` so the
 *     `useMotion` hook can collapse animations, per PRD s.18.
 *  3. The frozen token bundle, so `useTheme()` is the single import a component
 *     needs for colour, space, type, radius, shadow and motion.
 *
 * The scheme preference persists through StorageService like everything else.
 */

const THEME_PREFERENCES = ['system', 'light', 'dark'];

const ThemeContext = createContext(null);

function buildTheme(schemeName, reduceMotion) {
  const colors = schemes[schemeName] ?? schemes.light;
  return {
    scheme: schemeName,
    isDark: schemeName === 'dark',
    reduceMotion,
    colors,
    text: textVariants,
    fontFamilies,
    spacing,
    radii,
    shadows,
    layout,
    controlHeights,
    iconSizes,
    avatarSizes,
    borderWidths,
    minTouchTarget,
    motion: { durations, springs, easings, pressScale, pressOpacity },
  };
}

export function ThemeProvider({ children, initialPreference = 'system' }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState(initialPreference);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Restore the saved preference. Runs once; until it lands we render with the
  // OS scheme, which is the right guess and avoids a flash for most users.
  useEffect(() => {
    let cancelled = false;
    storage
      .get(StorageKeys.PREFERENCES)
      .then((prefs) => {
        const saved = prefs?.themePreference;
        if (!cancelled && THEME_PREFERENCES.includes(saved)) setPreferenceState(saved);
      })
      .catch(() => {
        // A missing preference is not an error - the OS default stands.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Track Reduce Motion, both its current value and later changes.
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (!cancelled) setReduceMotion(Boolean(value));
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (value) => setReduceMotion(Boolean(value))
    );

    return () => {
      cancelled = true;
      subscription?.remove?.();
    };
  }, []);

  const setPreference = useCallback(async (next) => {
    if (!THEME_PREFERENCES.includes(next)) return;
    setPreferenceState(next);
    try {
      const prefs = (await storage.get(StorageKeys.PREFERENCES)) ?? {};
      await storage.set(StorageKeys.PREFERENCES, { ...prefs, themePreference: next });
    } catch (error) {
      if (__DEV__) console.warn('[theme] Could not persist theme preference.', error);
    }
  }, []);

  const activeScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const theme = useMemo(
    () => buildTheme(activeScheme, reduceMotion),
    [activeScheme, reduceMotion]
  );

  const value = useMemo(
    () => ({ ...theme, preference, setPreference }),
    [theme, preference, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * The one hook a component needs for design tokens.
 * Throws outside a provider rather than returning a silent default - a missing
 * provider is a wiring bug, and failing loudly in dev is cheaper than debugging
 * an unstyled screen.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme() must be used inside <ThemeProvider>.');
  }
  return context;
}

/** Convenience for the common case of only needing colours. */
export function useColors() {
  return useTheme().colors;
}

export { THEME_PREFERENCES };
