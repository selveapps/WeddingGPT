/**
 * Motion tokens.
 *
 * Every animation pulls its timing from here so the whole product moves with
 * one cadence. `springs` are Reanimated `withSpring` configs; `durations` feed
 * `withTiming` and layout transitions.
 *
 * Components should read these through `useMotion()` rather than importing them
 * directly - that hook collapses everything to instant when the OS Reduce Motion
 * setting is on, which the PRD requires.
 */

export const durations = {
  instant: 0,
  fast: 140,
  base: 220,
  slow: 340,
  slower: 520,
  celebrate: 900,
};

/**
 * Every spring is over-damped and clamped, so nothing in the app bounces or
 * overshoots - motion simply eases into place.
 */
export const springs = {
  /** Default for cards, layout shifts, value changes. */
  gentle: { damping: 30, stiffness: 180, mass: 1, overshootClamping: true },
  /** Press feedback - quick and tight. */
  snappy: { damping: 32, stiffness: 320, mass: 0.7, overshootClamping: true },
  /** Bottom sheets and modals entering. */
  sheet: { damping: 34, stiffness: 240, mass: 1.1, overshootClamping: true },
  /** Kept for existing callers; now settles flat like the rest. */
  bouncy: { damping: 32, stiffness: 260, mass: 0.9, overshootClamping: true },
};

/**
 * Scale applied to a pressable while it is held down. Kept at 1: shrinking
 * every card and button on touch read as jittery, so press feedback is an
 * opacity dip only.
 */
export const pressScale = 1;

/** Opacity applied to a pressable while it is held down. */
export const pressOpacity = 0.9;

/** Easing curves as bezier control points, for `Easing.bezier(...easings.standard)`. */
export const easings = {
  standard: [0.2, 0, 0, 1],
  decelerate: [0, 0, 0, 1],
  accelerate: [0.3, 0, 1, 1],
};
