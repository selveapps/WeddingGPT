import React, { useMemo } from 'react';
import { Text as RNText } from 'react-native';

import { useTheme } from '../theme';

/**
 * The only text component in the app.
 *
 * Screens choose a `variant` (an intent) and a `color` (a semantic role); they
 * never pass fontSize, fontFamily or a hex value. That constraint is what keeps
 * 100+ screens visually coherent and makes a type-scale change a one-file edit.
 *
 * Also the single place we cap `maxFontSizeMultiplier`: users with large system
 * text still get a readable bump, but a 3x multiplier will not shred a layout.
 */

const COLOR_ALIASES = {
  default: 'ink',
  muted: 'inkMuted',
  subtle: 'inkSubtle',
  inverse: 'inkInverse',
  onBrand: 'inkOnBrand',
  brand: 'brand',
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

/** Display type is already large; allowing a further 1.4x would break countdowns. */
const MAX_SCALE_BY_VARIANT = {
  displayXl: 1.15,
  displayLg: 1.15,
  displayMd: 1.2,
  displayAccent: 1.2,
  displaySm: 1.25,
  numericLg: 1.2,
  h1: 1.3,
  h2: 1.3,
  // Five labels share one row; past this they would truncate.
  tab: 1.2,
  tabActive: 1.2,
};

const DEFAULT_MAX_SCALE = 1.6;

export function Text({
  variant = 'body',
  color = 'default',
  align,
  style,
  children,
  numberOfLines,
  /** Marks this as a heading for screen readers. */
  heading = false,
  ...rest
}) {
  const theme = useTheme();

  const resolved = useMemo(() => {
    const variantStyle = theme.text[variant] ?? theme.text.body;
    const role = COLOR_ALIASES[color] ?? color;
    const resolvedColor = theme.colors[role] ?? color;

    if (__DEV__ && !theme.text[variant]) {
      console.warn(`[Text] Unknown variant "${variant}" - falling back to "body".`);
    }

    return [
      variantStyle,
      { color: resolvedColor },
      align ? { textAlign: align } : null,
      style,
    ];
  }, [theme, variant, color, align, style]);

  return (
    <RNText
      style={resolved}
      numberOfLines={numberOfLines}
      maxFontSizeMultiplier={MAX_SCALE_BY_VARIANT[variant] ?? DEFAULT_MAX_SCALE}
      accessibilityRole={heading ? 'header' : undefined}
      {...rest}
    >
      {children}
    </RNText>
  );
}

export default Text;
