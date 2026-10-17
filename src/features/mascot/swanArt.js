/**
 * The mascot: a swan couple, as data.
 *
 * Two cute swans - the bride (left, with a little veil and flower crown) and
 * the groom (right, with a top hat and bow tie). Their necks curve towards
 * each other so the space between them makes a heart, and their beaks meet at
 * the top of it.
 *
 * Drawn from this one description everywhere: the in-app `<Mascot />`, the
 * landing animation (each swan on its own, see `swanArt`), and the app icon
 * export (`scripts/build-icons.mjs`). Change the swans here and everything
 * follows.
 *
 * Nodes are `[tag, attributes, children?]` with camelCase SVG attributes, in a
 * 120 x 120 space. Nodes with `blink: true` are eyes; the app animates their
 * `ry`. Colours are fixed character colours, not theme roles, so the swans look
 * the same in light and dark mode.
 *
 * Moods change faces, wings and extras only, never the silhouette:
 *  - `happy`     the default, smiling
 *  - `wave`      the bride raises a wing
 *  - `think`     eyes up, thought bubbles
 *  - `celebrate` closed happy eyes, a heart and sparkles above them
 */

export const MASCOT_MOODS = ['happy', 'wave', 'think', 'celebrate'];
export const MASCOT_VIEWBOX = '0 0 120 120';

const C = {
  feather: '#FFFFFF',
  featherShade: '#EFE6E3',
  outline: '#D8C7C0',
  wing: '#F3ECEA',
  wingLine: '#D9CCC6',
  beak: '#F2A93B',
  beakTip: '#D98A1C',
  ink: '#2A1E1A',
  cheek: '#F49AB3',
  veil: '#FFDCE6',
  petal: '#F49AB3',
  petalCentre: '#F8C871',
  hat: '#2A1E1A',
  hatBand: '#C93862',
  bow: '#2A1E1A',
  bowKnot: '#C93862',
  heart: '#E05A80',
  marigold: '#F2A93B',
  water: '#CFE3F5',
  thought: '#C9B8AE',
  white: '#FFFFFF',
};

export const SWAN_COLORS = C;

/** A four-point twinkle centred on (x, y). */
export function sparkle(x, y, s, fill) {
  const q = s * 0.2;
  return [
    'path',
    {
      d: `M${x} ${y - s} Q${x + q} ${y - q} ${x + s} ${y} Q${x + q} ${y + q} ${x} ${y + s} Q${x - q} ${y + q} ${x - s} ${y} Q${x - q} ${y - q} ${x} ${y - s} Z`,
      fill,
    },
  ];
}

/** A heart centred on (x, y), `s` about half its width. */
export function heart(x, y, s, fill) {
  return [
    'path',
    {
      d: `M${x} ${y + s * 0.9} C${x - s * 1.4} ${y} ${x - s * 0.9} ${y - s} ${x} ${y - s * 0.35} C${x + s * 0.9} ${y - s} ${x + s * 1.4} ${y} ${x} ${y + s * 0.9} Z`,
      fill,
    },
  ];
}

function gradients() {
  return [
    'defs',
    {},
    [
      [
        'linearGradient',
        { id: 'swanFeather', x1: 0, y1: 20, x2: 0, y2: 110, gradientUnits: 'userSpaceOnUse' },
        [
          ['stop', { offset: 0, stopColor: C.feather }],
          ['stop', { offset: 0.7, stopColor: C.feather }],
          ['stop', { offset: 1, stopColor: C.featherShade }],
        ],
      ],
    ],
  ];
}

// --- One swan, drawn as the bride (facing right). The groom is its mirror. --

const BODY = 'M58 92 C59 103 47 109 33 108 C19 107 9 100 6 88 C4 80 4 74 6 70 C10 80 16 86 25 85 C34 82 50 81 58 92 Z';
const NECK = 'M51 89 C39 80 30 66 31 52 C32 37 41 27 49 29';
const WING_DOWN = 'M17 94 C24 85 39 84 47 93 C40 92 33 95 29 101 C24 100 20 98 17 94 Z';
const WING_UP = 'M22 88 C16 76 18 63 27 56 C28 67 33 77 42 86 C35 88 28 89 22 88 Z';
const HEAD = { cx: 50.4, cy: 35, r: 8.4 };

function swanBody({ mood, side, mono }) {
  const fill = mono ? C.white : 'url(#swanFeather)';
  const stroke = mono ? C.white : C.outline;
  const wingUp = mood === 'wave' && side === 'bride';
  const feather = mono ? C.white : C.feather;
  return [
    'g',
    {},
    [
      // Layered so the neck flows out of the body with no seam: the neck's
      // outline goes under the body, its white fill over it.
      ['path', { d: NECK, fill: 'none', stroke, strokeWidth: 11.6, strokeLinecap: 'round' }],
      ['path', { d: BODY, fill, stroke, strokeWidth: 1.6, strokeLinejoin: 'round' }],
      ['path', { d: NECK, fill: 'none', stroke: feather, strokeWidth: 8.6, strokeLinecap: 'round' }],
      ['circle', { ...HEAD, fill: feather, stroke, strokeWidth: 1.6 }],
      // Cover the seam where neck meets head.
      ['circle', { cx: 47.6, cy: 31.4, r: 4.2, fill: feather }],
      mono
        ? null
        : ['path', { d: wingUp ? WING_UP : WING_DOWN, fill: C.wing, stroke: C.wingLine, strokeWidth: 1.3, strokeLinejoin: 'round' }],
      mono || wingUp
        ? null
        : ['path', { d: 'M25 97 C30 92 36 91 41 93 M29 101 C33 97 38 96 43 97', fill: 'none', stroke: C.wingLine, strokeWidth: 1.1, strokeLinecap: 'round' }],
    ].filter(Boolean),
  ];
}

function beak() {
  return [
    'g',
    {},
    [
      ['path', { d: 'M56.4 33.2 L60.2 38.6 C58.8 40.2 56.6 40.4 55 39.4 Z', fill: C.beak, stroke: C.beakTip, strokeWidth: 0.9, strokeLinejoin: 'round' }],
    ],
  ];
}

function face(mood) {
  if (mood === 'celebrate') {
    return [
      'g',
      {},
      [
        ['path', { d: 'M48.6 34.2 Q51.2 31 53.8 34.2', fill: 'none', stroke: C.ink, strokeWidth: 1.6, strokeLinecap: 'round' }],
        ['ellipse', { cx: 48.8, cy: 39.4, rx: 2.4, ry: 1.5, fill: C.cheek, opacity: 0.75 }],
      ],
    ];
  }
  const look = mood === 'think' ? -1.4 : 0;
  return [
    'g',
    {},
    [
      ['ellipse', { cx: 51.6, cy: 33.4 + look, rx: 2.1, ry: 2.7, fill: C.ink, blink: true }],
      ['circle', { cx: 52.3, cy: 32.4 + look, r: 0.8, fill: C.white }],
      ['ellipse', { cx: 48.8, cy: 39.4, rx: 2.4, ry: 1.5, fill: C.cheek, opacity: 0.75 }],
    ],
  ];
}

/** The veil sits behind the neck, so it is drawn before the swan. */
function brideVeil() {
  return [
    'path',
    {
      d: 'M45 27 C33 26 23 37 19 56 C25 50 30 47.5 34 47 C33 38.5 37.5 32 45 31 Z',
      fill: C.veil,
      stroke: '#F4B9CB',
      strokeWidth: 1.1,
      strokeLinejoin: 'round',
    },
  ];
}

function brideDetails() {
  const flower = (x, y) => [
    'g',
    {},
    [
      ['circle', { cx: x - 1.7, cy: y, r: 1.6, fill: C.petal }],
      ['circle', { cx: x + 1.7, cy: y, r: 1.6, fill: C.petal }],
      ['circle', { cx: x, cy: y - 1.7, r: 1.6, fill: C.petal }],
      ['circle', { cx: x, cy: y + 1.7, r: 1.6, fill: C.petal }],
      ['circle', { cx: x, cy: y, r: 1.1, fill: C.petalCentre }],
    ],
  ];
  return [
    'g',
    {},
    [
      flower(44.2, 28.6),
      flower(49.4, 26.4),
    ],
  ];
}

function groomDetails() {
  // Drawn in the bride's coordinates; the groom's group mirrors it.
  return [
    'g',
    {},
    [
      ['g', { transform: 'rotate(-12 50 27)' }, [
        ['rect', { x: 43, y: 25.6, width: 14, height: 2.6, rx: 1.2, fill: C.hat }],
        ['rect', { x: 46, y: 16.6, width: 8, height: 10, rx: 1.4, fill: C.hat }],
        ['rect', { x: 46, y: 22.8, width: 8, height: 2, fill: C.hatBand }],
      ]],
      // Bow tie on the front of the neck.
      ['path', { d: 'M36.5 68.5 L41.5 72 L36.5 75.5 Z M46.5 68.5 L41.5 72 L46.5 75.5 Z', fill: C.bow, stroke: C.bow, strokeWidth: 0.8, strokeLinejoin: 'round' }],
      ['circle', { cx: 41.5, cy: 72, r: 1.6, fill: C.bowKnot }],
    ],
  ];
}

/**
 * One swan in the 120 space: `side` is 'bride' (left, facing right) or 'groom'
 * (right, mirrored). `mono` draws a flat white silhouette for system icons.
 */
export function swanArt({ side = 'bride', mood = 'happy', mono = false } = {}) {
  const parts = [];
  if (!mono && side === 'bride') parts.push(brideVeil());
  parts.push(swanBody({ mood, side, mono }));
  if (!mono) {
    parts.push(beak(), face(mood), side === 'bride' ? brideDetails() : groomDetails());
  }
  const body = ['g', {}, parts];
  return side === 'groom' ? ['g', { transform: 'translate(120 0) scale(-1 1)' }, [body]] : body;
}

/** Soft ripples under the swans. */
export function water() {
  return [
    'g',
    { fill: 'none', stroke: C.water, strokeLinecap: 'round' },
    [
      ['path', { d: 'M14 112 Q60 106 106 112', strokeWidth: 3 }],
      ['path', { d: 'M30 117 Q60 113 90 117', strokeWidth: 2.2, opacity: 0.8 }],
    ],
  ];
}

function extras(mood) {
  if (mood === 'celebrate') {
    return [
      'g',
      {},
      [heart(60, 12, 6, C.heart), sparkle(14, 26, 5, C.marigold), sparkle(106, 24, 4.5, C.marigold), sparkle(100, 52, 3, C.heart), sparkle(20, 56, 3, C.heart)],
    ];
  }
  if (mood === 'think') {
    return ['g', { fill: C.thought }, [
      ['circle', { cx: 92, cy: 22, r: 2.2 }],
      ['circle', { cx: 99, cy: 14, r: 3 }],
      ['circle', { cx: 107, cy: 5.5, r: 3.8 }],
    ]];
  }
  if (mood === 'wave') {
    return ['g', {}, [sparkle(10, 46, 3.4, C.marigold)]];
  }
  return null;
}

/** Defs needed by any swan drawing. Include once per SVG. */
export function swanDefs() {
  return gradients();
}

/** The full mascot: both swans, water and mood extras. */
export function mascotArt(mood = 'happy') {
  const m = MASCOT_MOODS.includes(mood) ? mood : 'happy';
  return [
    'g',
    {},
    [gradients(), water(), swanArt({ side: 'bride', mood: m }), swanArt({ side: 'groom', mood: m }), extras(m)].filter(Boolean),
  ];
}
