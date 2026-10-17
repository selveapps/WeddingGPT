import { mascotArt, sparkle } from './swanArt';

/**
 * The app icon, as data - the single source for every place the icon shows.
 *
 * `scripts/build-icons.mjs` exports it to the store icon, Android icon layers,
 * splash image and favicon; `<AppIcon />` draws the very same tile inside the
 * app. Change the icon here and run `npm run icons`, and everything matches.
 *
 * Same node format as `swanArt`: `[tag, attributes, children?]`, drawn in a
 * 1024 x 1024 space.
 */

export const APP_ICON_SIZE = 1024;
export const APP_ICON_VIEWBOX = `0 0 ${APP_ICON_SIZE} ${APP_ICON_SIZE}`;

/**
 * Ivory melting into the app's own rose, from the design-system palette
 * (ivory, rose100/200/500, marigold300) so the icon and the app share one
 * colour scheme.
 */
export const APP_ICON_COLORS = {
  ivory: '#FFFBF8',
  roseLight: '#FFE8EF',
  rose: '#FAC8D6',
  roseDeep: '#E05A80',
  marigold: '#F8C871',
};

const S = APP_ICON_SIZE;
const C = APP_ICON_COLORS;

/** Rounded-corner radius matching the iOS icon shape (about 22% of the side). */
export const APP_ICON_CORNER = Math.round(S * 0.2237);

function twinkle(x, y, r, fill, opacity = 1) {
  return ['g', { opacity }, [sparkle(x, y, r, fill)]];
}

/** The tile behind the swans: gradient, glow and a few sparkles. */
export function appIconBackground({ radius = 0 } = {}) {
  return [
    'g',
    {},
    [
      [
        'defs',
        {},
        [
          [
            'linearGradient',
            { id: 'appIconBg', x1: 0, y1: 0, x2: S, y2: S, gradientUnits: 'userSpaceOnUse' },
            [
              ['stop', { offset: 0, stopColor: C.ivory }],
              ['stop', { offset: 0.5, stopColor: C.roseLight }],
              ['stop', { offset: 1, stopColor: C.rose }],
            ],
          ],
          [
            'radialGradient',
            { id: 'appIconGlow', cx: S / 2, cy: S * 0.54, r: S * 0.42, gradientUnits: 'userSpaceOnUse' },
            [
              ['stop', { offset: 0, stopColor: '#FFFFFF', stopOpacity: 0.8 }],
              ['stop', { offset: 1, stopColor: '#FFFFFF', stopOpacity: 0 }],
            ],
          ],
        ],
      ],
      ['rect', { width: S, height: S, rx: radius, ry: radius, fill: 'url(#appIconBg)' }],
      ['circle', { cx: S / 2, cy: S * 0.54, r: S * 0.42, fill: 'url(#appIconGlow)' }],
      twinkle(190, 230, 46, C.roseDeep, 0.45),
      twinkle(850, 300, 30, C.marigold),
      twinkle(820, 850, 24, C.roseDeep, 0.4),
      twinkle(170, 820, 18, C.marigold, 0.9),
    ],
  ];
}

/** The swan couple placed in the 1024 square at `scale` of its width, nudged down by `dy` (fraction of the side). */
export function placedMascot({ mood = 'happy', scale = 0.82, dy = 0 } = {}) {
  const k = (S * scale) / 120;
  const offset = (S - 120 * k) / 2;
  return ['g', { transform: `translate(${offset} ${offset + dy * S}) scale(${k})` }, [mascotArt(mood)]];
}

/**
 * The full icon. `radius` rounds the tile's corners - 0 for the store icon
 * (the OS applies its own mask), `APP_ICON_CORNER` wherever the app draws it.
 */
export function appIconArt({ radius = 0, mood = 'happy' } = {}) {
  return ['g', {}, [appIconBackground({ radius }), placedMascot({ mood })]];
}
