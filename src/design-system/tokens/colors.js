/**
 * WeddingGPT colour tokens.
 *
 * Two layers:
 *  1. `palette` — raw, named brand values. Never referenced directly by a screen.
 *  2. `lightScheme` / `darkScheme` — semantic roles. Screens only ever use these,
 *     via `useTheme().colors`, so re-theming is a single-file change.
 *
 * Brand direction: warm ivory paper, rosewood ink, antique gilt accent.
 * Deliberately editorial and calm — never a dashboard.
 */

export const palette = {
  // --- Brand ---------------------------------------------------------------
  rosewood900: '#4A1F2B',
  rosewood700: '#6E3243',
  rosewood600: '#8E4A5C',
  rosewood500: '#A55B6D',
  rosewood300: '#D98BA0',
  rosewood200: '#EFC4CF',
  rosewood100: '#FAE6EB',

  gilt700: '#8E6A28',
  gilt600: '#B3873C',
  gilt500: '#C79A4B',
  gilt300: '#E3BE79',
  gilt100: '#F7EBD4',

  // --- Support -------------------------------------------------------------
  sage700: '#3F5A44',
  sage500: '#5F7A63',
  sage300: '#93B098',
  sage100: '#E4EEE6',

  amber700: '#8A5A17',
  amber500: '#C8842B',
  amber300: '#E7B571',
  amber100: '#FBEEDA',

  clay700: '#7E3427',
  clay500: '#B3503C',
  clay300: '#DD9384',
  clay100: '#FAE5E0',

  // --- Warm neutrals (light) ----------------------------------------------
  ivory: '#FFFBF7',
  paper: '#FFFFFF',
  linen: '#F8F1EA',
  parchment: '#F2E9E1',
  sand: '#E8DCD2',
  stone: '#D8C8BB',
  taupe: '#9C8B81',
  umber: '#6B5A51',
  espresso: '#241A16',

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
  scrim: 'rgba(36, 26, 22, 0.44)',

  // Text and icons.
  ink: palette.espresso,
  inkMuted: palette.umber,
  inkSubtle: palette.taupe,
  inkInverse: palette.ivory,
  inkOnBrand: palette.ivory,

  // Lines.
  border: palette.sand,
  borderStrong: palette.stone,
  borderFocus: palette.rosewood600,

  // Brand.
  brand: palette.rosewood600,
  brandHover: palette.rosewood700,
  brandPressed: palette.rosewood900,
  brandSoft: palette.rosewood100,
  brandSoftInk: palette.rosewood700,

  accent: palette.gilt500,
  accentSoft: palette.gilt100,
  accentSoftInk: palette.gilt700,

  // Status.
  success: palette.sage500,
  successSoft: palette.sage100,
  successSoftInk: palette.sage700,

  warning: palette.amber500,
  warningSoft: palette.amber100,
  warningSoftInk: palette.amber700,

  danger: palette.clay500,
  dangerSoft: palette.clay100,
  dangerSoftInk: palette.clay700,

  info: palette.rosewood500,
  infoSoft: palette.rosewood100,
  infoSoftInk: palette.rosewood700,

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
  borderFocus: palette.rosewood300,

  brand: palette.rosewood300,
  brandHover: palette.rosewood200,
  brandPressed: palette.rosewood500,
  brandSoft: 'rgba(217, 139, 160, 0.16)',
  brandSoftInk: palette.rosewood200,

  accent: palette.gilt300,
  accentSoft: 'rgba(227, 190, 121, 0.16)',
  accentSoftInk: palette.gilt300,

  success: palette.sage300,
  successSoft: 'rgba(147, 176, 152, 0.16)',
  successSoftInk: palette.sage300,

  warning: palette.amber300,
  warningSoft: 'rgba(231, 181, 113, 0.16)',
  warningSoftInk: palette.amber300,

  danger: palette.clay300,
  dangerSoft: 'rgba(221, 147, 132, 0.16)',
  dangerSoftInk: palette.clay300,

  info: palette.rosewood300,
  infoSoft: 'rgba(217, 139, 160, 0.16)',
  infoSoftInk: palette.rosewood200,

  trackEmpty: palette.nightRaised,
  skeleton: palette.nightRaised,
  skeletonSheen: palette.nightBorder,
  overlayCard: 'rgba(34, 27, 25, 0.92)',
};

export const schemes = { light: lightScheme, dark: darkScheme };
