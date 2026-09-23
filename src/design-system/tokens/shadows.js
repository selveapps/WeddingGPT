import { Platform } from 'react-native';

/**
 * Elevation tokens.
 *
 * Shadows are warm-tinted rather than neutral grey, so cards sit on the ivory
 * canvas without looking smudged. Each token is a complete style object: iOS
 * gets the shadow triple, Android gets `elevation`, web gets `boxShadow`.
 */
const iosShadow = (opacity, radius, offsetY) => ({
  shadowColor: '#3A2318',
  shadowOpacity: opacity,
  shadowRadius: radius,
  shadowOffset: { width: 0, height: offsetY },
});

export const shadows = {
  none: Platform.select({
    ios: iosShadow(0, 0, 0),
    android: { elevation: 0 },
    default: {},
  }),

  /** Resting cards and list rows. */
  sm: Platform.select({
    ios: iosShadow(0.06, 8, 2),
    android: { elevation: 1 },
    default: { boxShadow: '0 2px 8px rgba(58, 35, 24, 0.06)' },
  }),

  /** Raised cards - the Next Best Action hero, selected states. */
  md: Platform.select({
    ios: iosShadow(0.09, 16, 6),
    android: { elevation: 4 },
    default: { boxShadow: '0 6px 16px rgba(58, 35, 24, 0.09)' },
  }),

  /** Bottom sheets, popovers, floating action buttons. */
  lg: Platform.select({
    ios: iosShadow(0.14, 28, 12),
    android: { elevation: 10 },
    default: { boxShadow: '0 12px 28px rgba(58, 35, 24, 0.14)' },
  }),

  /** Modals sitting over a scrim. */
  xl: Platform.select({
    ios: iosShadow(0.2, 40, 20),
    android: { elevation: 18 },
    default: { boxShadow: '0 20px 40px rgba(58, 35, 24, 0.2)' },
  }),
};
