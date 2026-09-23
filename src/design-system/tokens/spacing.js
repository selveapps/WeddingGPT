/**
 * A single 4pt-based spacing scale. Screens never write a raw number for
 * padding, margin or gap - they read from here, so vertical rhythm stays
 * consistent across every module.
 */
export const spacing = {
  none: 0,
  hair: 2,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  giant: 64,
  colossal: 80,
  vast: 96,
};

/** Horizontal page gutter. Every full-width screen uses this. */
export const gutter = spacing.lg;

export const spacingNames = Object.keys(spacing);

/**
 * Resolve a spacing token name (or a raw number) to pixels.
 * Accepting raw numbers keeps one-off nudges possible without forking the scale.
 */
export function space(token) {
  if (typeof token === 'number') return token;
  if (token == null) return 0;
  const value = spacing[token];
  if (value === undefined) {
    if (__DEV__) console.warn(`[design-system] Unknown spacing token "${token}"`);
    return 0;
  }
  return value;
}
