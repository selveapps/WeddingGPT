/**
 * Typography tokens.
 *
 * Two families carry the brand:
 *  - Fraunces (serif)  -> display + headings. Editorial, warm, a little characterful.
 *  - DM Sans (grotesk) -> body, labels, numerals. Quiet and highly legible at small sizes.
 *
 * `fontFamily` values must match the keys registered in `loadAppFonts()`.
 * Screens never hardcode a size - they use `<Text variant="..." />`.
 */

export const fontFamilies = {
  displayRegular: 'Fraunces-Regular',
  displayMedium: 'Fraunces-Medium',
  displaySemiBold: 'Fraunces-SemiBold',
  displayBold: 'Fraunces-Bold',

  bodyRegular: 'DMSans-Regular',
  bodyMedium: 'DMSans-Medium',
  bodySemiBold: 'DMSans-SemiBold',
  bodyBold: 'DMSans-Bold',
};

export const fontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 34,
  huge: 42,
  giant: 52,
  colossal: 64,
};

export const lineHeights = {
  tight: 1.12,
  snug: 1.24,
  normal: 1.45,
  relaxed: 1.6,
};

export const letterSpacings = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
  widest: 1.6,
};

const lh = (size, ratio) => Math.round(size * ratio * 100) / 100;

/**
 * Named text variants. Each one is a complete, ready-to-spread RN text style.
 * Keep this list small and intent-driven - a variant per meaning, not per pixel size.
 */
export const textVariants = {
  // --- Display: countdowns, hero numbers, onboarding questions -------------
  displayXl: {
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: fontSizes.colossal,
    lineHeight: lh(fontSizes.colossal, lineHeights.tight),
    letterSpacing: letterSpacings.tighter,
  },
  displayLg: {
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: fontSizes.giant,
    lineHeight: lh(fontSizes.giant, lineHeights.tight),
    letterSpacing: letterSpacings.tighter,
  },
  displayMd: {
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: fontSizes.huge,
    lineHeight: lh(fontSizes.huge, lineHeights.snug),
    letterSpacing: letterSpacings.tight,
  },
  displaySm: {
    fontFamily: fontFamilies.displayMedium,
    fontSize: fontSizes.xxxl,
    lineHeight: lh(fontSizes.xxxl, lineHeights.snug),
    letterSpacing: letterSpacings.tight,
  },

  // --- Headings ------------------------------------------------------------
  h1: {
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: fontSizes.xxl,
    lineHeight: lh(fontSizes.xxl, lineHeights.snug),
    letterSpacing: letterSpacings.tight,
  },
  h2: {
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: fontSizes.xl,
    lineHeight: lh(fontSizes.xl, lineHeights.snug),
    letterSpacing: letterSpacings.tight,
  },
  h3: {
    fontFamily: fontFamilies.displayMedium,
    fontSize: fontSizes.lg,
    lineHeight: lh(fontSizes.lg, lineHeights.normal),
    letterSpacing: letterSpacings.normal,
  },
  h4: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: fontSizes.md,
    lineHeight: lh(fontSizes.md, lineHeights.normal),
    letterSpacing: letterSpacings.normal,
  },

  // --- Body ----------------------------------------------------------------
  bodyLg: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: fontSizes.md,
    lineHeight: lh(fontSizes.md, lineHeights.relaxed),
    letterSpacing: letterSpacings.normal,
  },
  body: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: fontSizes.base,
    lineHeight: lh(fontSizes.base, lineHeights.relaxed),
    letterSpacing: letterSpacings.normal,
  },
  bodyStrong: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.base,
    lineHeight: lh(fontSizes.base, lineHeights.relaxed),
    letterSpacing: letterSpacings.normal,
  },
  bodySm: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: fontSizes.sm,
    lineHeight: lh(fontSizes.sm, lineHeights.normal),
    letterSpacing: letterSpacings.normal,
  },

  // --- Utility -------------------------------------------------------------
  label: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    lineHeight: lh(fontSizes.sm, lineHeights.normal),
    letterSpacing: letterSpacings.normal,
  },
  labelStrong: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: fontSizes.sm,
    lineHeight: lh(fontSizes.sm, lineHeights.normal),
    letterSpacing: letterSpacings.normal,
  },
  caption: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: fontSizes.xs,
    lineHeight: lh(fontSizes.xs, lineHeights.normal),
    letterSpacing: letterSpacings.normal,
  },
  /** Small section eyebrow, e.g. UPCOMING. */
  eyebrow: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: fontSizes.xs,
    lineHeight: lh(fontSizes.xs, lineHeights.normal),
    letterSpacing: letterSpacings.widest,
    textTransform: 'uppercase',
  },
  /** Buttons and tab labels. */
  action: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: fontSizes.base,
    lineHeight: lh(fontSizes.base, lineHeights.snug),
    letterSpacing: letterSpacings.normal,
  },
  actionSm: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: fontSizes.sm,
    lineHeight: lh(fontSizes.sm, lineHeights.snug),
    letterSpacing: letterSpacings.normal,
  },
  /** Money and counts - tabular so animating digits do not jitter. */
  numeric: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.lg,
    lineHeight: lh(fontSizes.lg, lineHeights.snug),
    letterSpacing: letterSpacings.normal,
    fontVariant: ['tabular-nums'],
  },
  numericLg: {
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: fontSizes.xxxl,
    lineHeight: lh(fontSizes.xxxl, lineHeights.tight),
    letterSpacing: letterSpacings.tight,
    fontVariant: ['tabular-nums'],
  },
};

export const textVariantNames = Object.keys(textVariants);
