import { Platform } from 'react-native';

/**
 * Shared accessibility prop sets.
 *
 * Kept here rather than inline so every component hides decorative content the
 * same way, and so the web/native split is written down once.
 */

/**
 * Hide a purely visual element from assistive technology.
 *
 * `accessibilityElementsHidden` (iOS) and `importantForAccessibility`
 * (Android) are native-only props that mean nothing on the web. React Native
 * Web quietly drops unknown props from its own components, but
 * `react-native-svg` spreads everything it is given straight onto the DOM node
 * - so passing them to `<Svg>` makes React warn about an unrecognised
 * attribute. `aria-hidden` is the web equivalent, and `focusable={false}`
 * keeps an inline SVG out of the tab order.
 */
export const decorative = Platform.select({
  web: { 'aria-hidden': true, focusable: false },
  default: {
    accessibilityElementsHidden: true,
    importantForAccessibility: 'no-hide-descendants',
  },
});

export default decorative;
