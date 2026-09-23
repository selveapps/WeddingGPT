import React from 'react';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

import { useTheme } from '../theme';
import { decorative } from './a11y';

/**
 * The WeddingGPT icon set.
 *
 * Drawn in-house on a 24x24 grid with a consistent 1.7 stroke, round caps and
 * round joins, so the whole set reads as one family. All original geometry -
 * the PRD forbids borrowing another product's icon artwork.
 *
 * Icons inherit colour from the `color` prop (a semantic theme role) and scale
 * from the `size` prop (an `iconSizes` token). Adding an icon means adding one
 * entry to `paths` below and nothing else.
 */

const VIEW_BOX = 24;

/**
 * Each entry is a render function receiving the shared stroke props, so an icon
 * can use whatever primitives it needs rather than being forced into one path.
 */
const paths = {
  // --- Navigation ----------------------------------------------------------
  home: (p) => (
    <>
      <Path d="M3.6 10.2 12 3.5l8.4 6.7" {...p} />
      <Path d="M5.6 11.6v7.2a1.4 1.4 0 0 0 1.4 1.4h10a1.4 1.4 0 0 0 1.4-1.4v-7.2" {...p} />
      <Path d="M9.8 20.2v-5.1h4.4v5.1" {...p} />
    </>
  ),
  checklist: (p) => (
    <>
      <Path d="M4 6.6 5.6 8.2 8.4 5.2" {...p} />
      <Path d="M4 12.6 5.6 14.2 8.4 11.2" {...p} />
      <Path d="M4 18.6 5.6 20.2 8.4 17.2" {...p} />
      <Line x1="11.6" y1="6.8" x2="20" y2="6.8" {...p} />
      <Line x1="11.6" y1="12.8" x2="20" y2="12.8" {...p} />
      <Line x1="11.6" y1="18.8" x2="20" y2="18.8" {...p} />
    </>
  ),
  guests: (p) => (
    <>
      <Circle cx="9.2" cy="8.4" r="3.4" {...p} />
      <Path d="M3.2 20.1a6 6 0 0 1 12 0" {...p} />
      <Path d="M16 5.4a3.4 3.4 0 0 1 0 6.2" {...p} />
      <Path d="M17.4 14.7a6 6 0 0 1 3.4 5.4" {...p} />
    </>
  ),
  budget: (p) => (
    <>
      <Path d="M20 9.2H6.6a2.6 2.6 0 0 1 0-5.2h10.2v5.2" {...p} />
      <Path d="M4 6.6v11.2A2.6 2.6 0 0 0 6.6 20.4H20V9.2" {...p} />
      <Circle cx="16.2" cy="14.8" r="1.3" {...p} />
    </>
  ),
  /** The AI entry point. A four-point sparkle, our stand-in for "assistant". */
  sparkle: (p) => (
    <>
      <Path d="M12 3.2c.9 3.9 1.7 4.7 5.6 5.6-3.9.9-4.7 1.7-5.6 5.6-.9-3.9-1.7-4.7-5.6-5.6 3.9-.9 4.7-1.7 5.6-5.6Z" {...p} />
      <Path d="M17.6 15.2c.5 2 .9 2.4 2.9 2.9-2 .5-2.4.9-2.9 2.9-.5-2-.9-2.4-2.9-2.9 2-.5 2.4-.9 2.9-2.9Z" {...p} />
    </>
  ),
  vendors: (p) => (
    <>
      <Path d="M4 8.6 5.6 4h12.8L20 8.6" {...p} />
      <Path d="M4 8.6h16a2.8 2.8 0 0 1-5.4 1 2.8 2.8 0 0 1-5.2 0 2.8 2.8 0 0 1-5.4-1Z" {...p} />
      <Path d="M5.6 12.2v6.6a1.4 1.4 0 0 0 1.4 1.4h10a1.4 1.4 0 0 0 1.4-1.4v-6.6" {...p} />
    </>
  ),
  vision: (p) => (
    <>
      <Rect x="3.6" y="3.6" width="7.2" height="7.2" rx="1.8" {...p} />
      <Rect x="13.2" y="3.6" width="7.2" height="4.6" rx="1.8" {...p} />
      <Rect x="3.6" y="13.2" width="7.2" height="4.6" rx="1.8" {...p} />
      <Rect x="13.2" y="10.6" width="7.2" height="9.8" rx="1.8" {...p} />
    </>
  ),

  // --- Actions -------------------------------------------------------------
  plus: (p) => (
    <>
      <Line x1="12" y1="5" x2="12" y2="19" {...p} />
      <Line x1="5" y1="12" x2="19" y2="12" {...p} />
    </>
  ),
  check: (p) => <Path d="M4.8 12.6 9.6 17.4 19.2 6.6" {...p} />,
  close: (p) => (
    <>
      <Line x1="6" y1="6" x2="18" y2="18" {...p} />
      <Line x1="18" y1="6" x2="6" y2="18" {...p} />
    </>
  ),
  chevronRight: (p) => <Path d="M9.4 5.4 16 12l-6.6 6.6" {...p} />,
  chevronLeft: (p) => <Path d="M14.6 5.4 8 12l6.6 6.6" {...p} />,
  chevronDown: (p) => <Path d="M5.4 9.4 12 16l6.6-6.6" {...p} />,
  chevronUp: (p) => <Path d="M5.4 14.6 12 8l6.6 6.6" {...p} />,
  arrowRight: (p) => (
    <>
      <Line x1="4.4" y1="12" x2="19" y2="12" {...p} />
      <Path d="M13.4 6.4 19 12l-5.6 5.6" {...p} />
    </>
  ),
  arrowLeft: (p) => (
    <>
      <Line x1="19.6" y1="12" x2="5" y2="12" {...p} />
      <Path d="M10.6 6.4 5 12l5.6 5.6" {...p} />
    </>
  ),
  edit: (p) => (
    <>
      <Path d="M15.6 4.8 19.2 8.4 8.6 19H5v-3.6L15.6 4.8Z" {...p} />
      <Line x1="13.6" y1="6.8" x2="17.2" y2="10.4" {...p} />
    </>
  ),
  trash: (p) => (
    <>
      <Line x1="4.4" y1="6.8" x2="19.6" y2="6.8" {...p} />
      <Path d="M9.2 6.8V4.9a1.3 1.3 0 0 1 1.3-1.3h3a1.3 1.3 0 0 1 1.3 1.3v1.9" {...p} />
      <Path d="M6.4 6.8 7.3 19a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.9-12.2" {...p} />
    </>
  ),
  search: (p) => (
    <>
      <Circle cx="10.8" cy="10.8" r="6" {...p} />
      <Line x1="15.3" y1="15.3" x2="20" y2="20" {...p} />
    </>
  ),
  filter: (p) => (
    <>
      <Line x1="4" y1="7.2" x2="20" y2="7.2" {...p} />
      <Line x1="7" y1="12" x2="17" y2="12" {...p} />
      <Line x1="10" y1="16.8" x2="14" y2="16.8" {...p} />
    </>
  ),
  sort: (p) => (
    <>
      <Path d="M7.2 4.6v14.8M3.8 8 7.2 4.6 10.6 8" {...p} />
      <Path d="M16.8 19.4V4.6M13.4 16l3.4 3.4L20.2 16" {...p} />
    </>
  ),
  more: (p) => (
    <>
      <Circle cx="5.4" cy="12" r="1.5" {...p} />
      <Circle cx="12" cy="12" r="1.5" {...p} />
      <Circle cx="18.6" cy="12" r="1.5" {...p} />
    </>
  ),
  refresh: (p) => (
    <>
      <Path d="M19.4 12a7.4 7.4 0 1 1-2.2-5.2" {...p} />
      <Path d="M19.8 4.4v4.4h-4.4" {...p} />
    </>
  ),
  send: (p) => (
    <>
      <Path d="M20.4 3.6 10.6 13.4" {...p} />
      <Path d="M20.4 3.6 14.2 20.4l-3.6-7-7-3.6 16.8-6.2Z" {...p} />
    </>
  ),

  // --- Objects and status --------------------------------------------------
  calendar: (p) => (
    <>
      <Rect x="3.6" y="5.4" width="16.8" height="15" rx="2.4" {...p} />
      <Line x1="3.6" y1="10" x2="20.4" y2="10" {...p} />
      <Line x1="8.4" y1="3.4" x2="8.4" y2="7.2" {...p} />
      <Line x1="15.6" y1="3.4" x2="15.6" y2="7.2" {...p} />
    </>
  ),
  clock: (p) => (
    <>
      <Circle cx="12" cy="12" r="8.2" {...p} />
      <Path d="M12 7.4V12l3.2 2" {...p} />
    </>
  ),
  snooze: (p) => (
    <>
      <Path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6Z" {...p} />
      <Path d="M14.6 4h4l-4 4.4h4" {...p} />
    </>
  ),
  bell: (p) => (
    <>
      <Path d="M17.8 16.6V10.4a5.8 5.8 0 0 0-11.6 0v6.2L4.6 18.6h14.8l-1.6-2Z" {...p} />
      <Path d="M10.2 21a2 2 0 0 0 3.6 0" {...p} />
    </>
  ),
  heart: (p) => (
    <Path
      d="M12 20.2 4.9 13.4a4.4 4.4 0 0 1 .2-6.5 4.6 4.6 0 0 1 6.3.4l.6.7.6-.7a4.6 4.6 0 0 1 6.3-.4 4.4 4.4 0 0 1 .2 6.5L12 20.2Z"
      {...p}
    />
  ),
  /** Two interlocking rings - our wedding mark. */
  rings: (p) => (
    <>
      <Circle cx="9" cy="14.4" r="5.2" {...p} />
      <Circle cx="15" cy="14.4" r="5.2" {...p} />
      <Path d="M13.4 4.2 15 6.8l1.6-2.6-1.6-1-1.6 1Z" {...p} />
    </>
  ),
  note: (p) => (
    <>
      <Path d="M14 3.6H6.6a1.8 1.8 0 0 0-1.8 1.8v13.2a1.8 1.8 0 0 0 1.8 1.8h10.8a1.8 1.8 0 0 0 1.8-1.8V9l-5.2-5.4Z" {...p} />
      <Path d="M13.8 3.8V9h5.2" {...p} />
    </>
  ),
  tag: (p) => (
    <>
      <Path d="M11.4 3.8H4v7.4l9 9 7.4-7.4-9-9Z" {...p} />
      <Circle cx="7.9" cy="7.7" r="1.3" {...p} />
    </>
  ),
  phone: (p) => (
    <Path
      d="M20 16.6v2.6a1.6 1.6 0 0 1-1.8 1.6A16.4 16.4 0 0 1 3.2 5.8 1.6 1.6 0 0 1 4.8 4h2.6a1.6 1.6 0 0 1 1.6 1.4c.1 1 .3 1.9.6 2.8a1.6 1.6 0 0 1-.4 1.7L8.1 11a13 13 0 0 0 4.9 4.9l1.1-1.1a1.6 1.6 0 0 1 1.7-.4c.9.3 1.8.5 2.8.6a1.6 1.6 0 0 1 1.4 1.6Z"
      {...p}
    />
  ),
  mail: (p) => (
    <>
      <Rect x="3.4" y="5.4" width="17.2" height="13.2" rx="2.2" {...p} />
      <Path d="m3.8 7.2 8.2 5.6 8.2-5.6" {...p} />
    </>
  ),
  user: (p) => (
    <>
      <Circle cx="12" cy="8.2" r="3.8" {...p} />
      <Path d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0" {...p} />
    </>
  ),
  settings: (p) => (
    <>
      <Circle cx="12" cy="12" r="2.8" {...p} />
      <Path d="M18.9 14.2a1.5 1.5 0 0 0 .3 1.6l.1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1a1.5 1.5 0 0 0-2.5 1v.2a1.8 1.8 0 1 1-3.6 0v-.1a1.5 1.5 0 0 0-2.6-1l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.5 1.5 0 0 0-1-2.5h-.2a1.8 1.8 0 1 1 0-3.6h.1a1.5 1.5 0 0 0 1-2.6l-.1-.1A1.8 1.8 0 1 1 7.7 4.6l.1.1a1.5 1.5 0 0 0 2.5-1v-.2a1.8 1.8 0 1 1 3.6 0v.1a1.5 1.5 0 0 0 2.6 1l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.5 1.5 0 0 0 1 2.5h.2a1.8 1.8 0 1 1 0 3.6h-.1a1.5 1.5 0 0 0-1.2 1Z" {...p} />
    </>
  ),
  alert: (p) => (
    <>
      <Path d="M12 4.2 21 19.4H3L12 4.2Z" {...p} />
      <Line x1="12" y1="10" x2="12" y2="14" {...p} />
      <Circle cx="12" cy="16.8" r="0.9" {...p} />
    </>
  ),
  info: (p) => (
    <>
      <Circle cx="12" cy="12" r="8.4" {...p} />
      <Line x1="12" y1="11.2" x2="12" y2="16.4" {...p} />
      <Circle cx="12" cy="8" r="0.9" {...p} />
    </>
  ),
  lock: (p) => (
    <>
      <Rect x="4.8" y="10.4" width="14.4" height="9.8" rx="2.2" {...p} />
      <Path d="M8.2 10.4V7.8a3.8 3.8 0 0 1 7.6 0v2.6" {...p} />
    </>
  ),
  star: (p) => (
    <Path d="m12 3.8 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 17.2l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8L12 3.8Z" {...p} />
  ),
  camera: (p) => (
    <>
      <Path d="M4.4 8.4h3l1.5-2.4h6.2l1.5 2.4h3a1.6 1.6 0 0 1 1.6 1.6v8a1.6 1.6 0 0 1-1.6 1.6H4.4A1.6 1.6 0 0 1 2.8 18v-8a1.6 1.6 0 0 1 1.6-1.6Z" {...p} />
      <Circle cx="12" cy="13.6" r="3.4" {...p} />
    </>
  ),
  location: (p) => (
    <>
      <Path d="M12 21c4-4.3 6-7.6 6-10a6 6 0 1 0-12 0c0 2.4 2 5.7 6 10Z" {...p} />
      <Circle cx="12" cy="10.6" r="2.4" {...p} />
    </>
  ),
};

export const iconNames = Object.keys(paths);

export function Icon({
  name,
  size = 'lg',
  color = 'ink',
  strokeWidth = 1.7,
  /** Filled icons (e.g. a saved heart) use the colour as fill instead of stroke. */
  filled = false,
  style,
  ...rest
}) {
  const theme = useTheme();

  const render = paths[name];
  if (!render) {
    if (__DEV__) console.warn(`[Icon] Unknown icon "${name}".`);
    return null;
  }

  const px = typeof size === 'number' ? size : theme.iconSizes[size] ?? theme.iconSizes.lg;
  const resolvedColor = theme.colors[color] ?? color;

  const strokeProps = {
    stroke: filled ? 'none' : resolvedColor,
    fill: filled ? resolvedColor : 'none',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  return (
    <Svg
      width={px}
      height={px}
      viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`}
      style={style}
      // Icons are decorative by default; the control around them carries the label.
      {...decorative}
      {...rest}
    >
      {render(strokeProps)}
    </Svg>
  );
}

export default Icon;
