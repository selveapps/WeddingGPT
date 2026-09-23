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

export const springs = {
  /** Default for cards, layout shifts, value changes. Settles with no visible bounce. */
  gentle: { damping: 20, stiffness: 180, mass: 1 },
  /** Press feedback - quick and tight. */
  snappy: { damping: 18, stiffness: 320, mass: 0.7 },
  /** Bottom sheets and modals entering. */
  sheet: { damping: 26, stiffness: 240, mass: 1.1 },
  /** Completion checkmarks and celebration pops. A little life, never cartoonish. */
  bouncy: { damping: 12, stiffness: 260, mass: 0.9 },
};

/** Scale applied to a pressable while it is held down. */
export const pressScale = 0.97;

/** Opacity applied to a pressable while it is held down. */
export const pressOpacity = 0.9;

/** Easing curves as bezier control points, for `Easing.bezier(...easings.standard)`. */
export const easings = {
  standard: [0.2, 0, 0, 1],
  decelerate: [0, 0, 0, 1],
  accelerate: [0.3, 0, 1, 1],
};
