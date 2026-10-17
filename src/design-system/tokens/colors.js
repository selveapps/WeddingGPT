/**
 * WeddingGPT colour tokens.
 *
 * Two layers:
 *  1. `palette` — raw, named brand values. Never referenced directly by a screen.
 *  2. `lightScheme` / `darkScheme` — semantic roles. Screens only ever use these,
 *     via `useTheme().colors`, so re-theming is a single-file change.
 *
 * Brand direction: bright ivory paper, a happy rose and a sunny marigold
 * accent. Cheerful but soft - light and airy, never loud.
 */

export const palette = {
  // --- Brand ---------------------------------------------------------------
  // A clear, happy rose. 600 carries white text at AA (4.9:1).
  rose900: '#7A1C3B',
  rose700: '#A3284D',
  rose600: '#C93862',
  rose500: '#E05A80',
  rose300: '#F49AB3',
  rose200: '#FAC8D6',
  rose100: '#FFE8EF',

  // Sunny marigold - the celebratory accent.
  marigold700: '#9A5F00',
  marigold600: '#D98A1C',
  marigold500: '#F2A93B',
  marigold300: '#F8C871',
  marigold100: '#FFF1D6',

  // --- Support -------------------------------------------------------------
  mint700: '#2B7148',
  mint500: '#3E9E68',
  mint300: '#86CFA2',
  mint100: '#E3F6EA',

  amber700: '#95560A',
  amber500: '#E8901C',
  amber300: '#F5BC6A',
  amber100: '#FFF0D9',

  coral700: '#B0322A',
  coral500: '#E0533F',
  coral300: '#F29A8C',
  coral100: '#FFE6E1',

  // --- Warm neutrals (light) ----------------------------------------------
  ivory: '#FFFBF8',
  paper: '#FFFFFF',
  linen: '#FCF5F1',
  parchment: '#F6EEE9',
  sand: '#EFE4DD',
  stone: '#E0D1C7',
  taupe: '#978680',
  umber: '#6A5850',
  espresso: '#2A1E1A',

  // --- Warm neutrals (dark) ------------------------------------------------
  night: '#191413',
  nightSurface: '#221B19',
  nightRaised: '#2B2321',
  nightSunken: '#120E0E',
  nightBorder: '#392F2C',
  nightBorderStrong: '#4A3E3A',
  nightInk: '#F6EDE7',
  nightInkMuted: '#BCA89E',
  nightInkSubtle: '#8C7A71',

  // --- Absolutes -----------------------------------------------------------
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

/** Semantic roles for light mode. */
export const lightScheme = {
  mode: 'light',

  // Surfaces, back to front.
  canvas: palette.ivory,
  surface: palette.paper,
  surfaceMuted: palette.linen,
  surfaceSunken: palette.parchment,
  surfaceInverse: palette.espresso,
  scrim: 'rgba(42, 30, 26, 0.4)',

  // Text and icons.
  ink: palette.espresso,
  inkMuted: palette.umber,
  inkSubtle: palette.taupe,
  inkInverse: palette.ivory,
  inkOnBrand: palette.white,

  // Lines.
  border: palette.sand,
  borderStrong: palette.stone,
  borderFocus: palette.rose600,

  // Brand.
  brand: palette.rose600,
  brandHover: palette.rose700,
  brandPressed: palette.rose900,
  brandSoft: palette.rose100,
  brandSoftInk: palette.rose700,

  accent: palette.marigold500,
  accentSoft: palette.marigold100,
  accentSoftInk: palette.marigold700,

  // Status.
  success: palette.mint500,
  successSoft: palette.mint100,
  successSoftInk: palette.mint700,

  warning: palette.amber500,
  warningSoft: palette.amber100,
  warningSoftInk: palette.amber700,

  danger: palette.coral500,
  dangerSoft: palette.coral100,
  dangerSoftInk: palette.coral700,

  info: palette.rose500,
  infoSoft: palette.rose100,
  infoSoftInk: palette.rose700,

  // Component-specific.
  trackEmpty: palette.parchment,
  skeleton: palette.parchment,
  skeletonSheen: palette.linen,
  overlayCard: 'rgba(255, 251, 247, 0.92)',
};

/** Semantic roles for dark mode. Same key set as `lightScheme` — enforced by a test. */
export const darkScheme = {
  mode: 'dark',

  canvas: palette.night,
  surface: palette.nightSurface,
  surfaceMuted: palette.nightRaised,
  surfaceSunken: palette.nightSunken,
  surfaceInverse: palette.ivory,
  scrim: 'rgba(0, 0, 0, 0.6)',

  ink: palette.nightInk,
  inkMuted: palette.nightInkMuted,
  inkSubtle: palette.nightInkSubtle,
  inkInverse: palette.espresso,
  inkOnBrand: palette.espresso,

  border: palette.nightBorder,
  borderStrong: palette.nightBorderStrong,
  borderFocus: palette.rose300,

  brand: palette.rose300,
  brandHover: palette.rose200,
  brandPressed: palette.rose500,
  brandSoft: 'rgba(244, 154, 179, 0.16)',
  brandSoftInk: palette.rose200,

  accent: palette.marigold300,
  accentSoft: 'rgba(248, 200, 113, 0.16)',
  accentSoftInk: palette.marigold300,

  success: palette.mint300,
  successSoft: 'rgba(134, 207, 162, 0.16)',
  successSoftInk: palette.mint300,

  warning: palette.amber300,
  warningSoft: 'rgba(231, 181, 113, 0.16)',
  warningSoftInk: palette.amber300,

  danger: palette.coral300,
  dangerSoft: 'rgba(242, 154, 140, 0.16)',
  dangerSoftInk: palette.coral300,

  info: palette.rose300,
  infoSoft: 'rgba(244, 154, 179, 0.16)',
  infoSoftInk: palette.rose200,

  trackEmpty: palette.nightRaised,
  skeleton: palette.nightRaised,
  skeletonSheen: palette.nightBorder,
  overlayCard: 'rgba(34, 27, 25, 0.92)',
};

export const schemes = { light: lightScheme, dark: darkScheme };
