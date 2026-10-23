import { useWindowDimensions } from 'react-native';

/**
 * Layout breakpoints, by window width rather than platform: a tablet in
 * landscape gets the wide layout too, and a narrow browser window gets the
 * phone layout. Screens use `isWide` to switch, for example, a guest list from
 * rows to a table.
 */
export const BREAKPOINTS = {
  wide: 900,
};

export function breakpointFor(width) {
  return { width, isWide: width >= BREAKPOINTS.wide };
}

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  return breakpointFor(width);
}
