import { Platform } from 'react-native';
import * as ExpoHaptics from 'expo-haptics';

/**
 * Haptics, centralised.
 *
 * The PRD is specific about intent (s.18): light for selection, medium for
 * meaningful completion, success notification for milestones. Exposing named
 * intents rather than raw `impactAsync` calls keeps that vocabulary consistent
 * and makes it trivial to mute everything from one place.
 *
 * Two mute paths:
 *  - `setHapticsEnabled(false)` from the user's notification/accessibility prefs.
 *  - Platforms without a taptic engine (web) short-circuit automatically.
 *
 * Every call is fire-and-forget and swallows errors: a failed haptic must never
 * interrupt the interaction that triggered it.
 */

const SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

let enabled = true;

/** Called by the settings store when the user toggles haptics. */
export function setHapticsEnabled(next) {
  enabled = Boolean(next);
}

export function areHapticsEnabled() {
  return enabled && SUPPORTED;
}

function run(fn) {
  if (!enabled || !SUPPORTED) return;
  try {
    const result = fn();
    if (result && typeof result.catch === 'function') result.catch(() => {});
  } catch {
    // Haptics are decorative - never let a failure surface to the user.
  }
}

export const haptics = {
  /** Selecting a chip, toggling a filter, moving through onboarding options. */
  selection() {
    run(() => ExpoHaptics.selectionAsync());
  },

  /** Minor confirmations - adding a row, opening a sheet. */
  light() {
    run(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light));
  },

  /** Meaningful actions - completing a task, saving a vendor, confirming an AI change. */
  medium() {
    run(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium));
  },

  /** Reserved for genuinely weighty moments. Used sparingly. */
  heavy() {
    run(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy));
  },

  /** Milestones: onboarding finished, purchase complete, a whole category done. */
  success() {
    run(() => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success));
  },

  /** Destructive confirmations and over-budget crossings. */
  warning() {
    run(() => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning));
  },

  /** Failed purchase, failed save. Only where the user must notice. */
  error() {
    run(() => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error));
  },
};

export default haptics;
