import { spacing } from './spacing';

/**
 * Fixed component dimensions and touch-target rules.
 * 44pt is the accessibility floor for anything tappable - no exceptions.
 */
export const minTouchTarget = 44;

export const controlHeights = {
  sm: 36,
  md: 44,
  lg: 52,
  xl: 58,
};

export const iconSizes = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 44,
};

export const avatarSizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

export const borderWidths = {
  hairline: 1,
  thin: 1.5,
  thick: 2,
};

export const layout = {
  /** Horizontal page gutter. */
  gutter: spacing.lg,
  /** Vertical gap between stacked cards and sections on a scroll screen. */
  sectionGap: spacing.xl,
  /** Extra bottom padding so content clears the tab bar and home indicator. */
  scrollBottomInset: spacing.colossal,
  tabBarHeight: 60,
  headerHeight: 56,
  /** Caps line length on tablets and wide screens so body text stays readable. */
  maxContentWidth: 560,
};
