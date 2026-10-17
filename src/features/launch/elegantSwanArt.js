/**
 * The elegant swan pair for the landing animation.
 *
 * Unlike the cute mascot, these are graceful swans: long tapered necks that
 * curve up and over so the pair frame a heart, raised feathered wings, orange
 * beaks with a black knob, on a little pool of water. Original artwork in the
 * spirit of a classic "two swans make a heart" emblem.
 *
 * Drawn in a 200 x 200 space. `elegantSwan('left')` faces right; the right
 * swan is its mirror. Same node format as the mascot art
 * (`[tag, attributes, children?]`), drawn in the app by `renderArt`.
 */

export const ELEGANT_VIEWBOX = '0 0 200 200';

const C = {
  feather: '#FFFFFF',
  shade: '#EEE8EC',
  shadeDeep: '#DCD2DA',
  outline: '#D3C4CE',
  beak: '#F07C2A',
  beakDeep: '#C9581A',
  knob: '#2A1E1A',
  eye: '#2A1E1A',
  waterDeep: '#8FC1CF',
  water: '#C6E1E9',
  heart: '#E05A80',
};

export const ELEGANT_COLORS = C;

// --- Tapered neck ------------------------------------------------------------

function bezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

/**
 * A filled shape following a chain of cubic segments, `from` wide at the start
 * and `to` wide at the end - a stroke that tapers, which plain SVG strokes
 * cannot do.
 */
function taperedPath(segments, from, to, samples = 28) {
  const centre = [];
  segments.forEach((seg, i) => {
    for (let s = i === 0 ? 0 : 1; s <= samples; s++) centre.push(bezier(...seg, s / samples));
  });
  const left = [];
  const right = [];
  centre.forEach((point, i) => {
    const prev = centre[Math.max(0, i - 1)];
    const next = centre[Math.min(centre.length - 1, i + 1)];
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    const half = (from + (to - from) * (i / (centre.length - 1))) / 2;
    const nx = (-dy / len) * half;
    const ny = (dx / len) * half;
    left.push([point[0] + nx, point[1] + ny]);
    right.push([point[0] - nx, point[1] - ny]);
  });
  const fmt = ([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`;
  return `M${left.map(fmt).join(' L')} L${right.reverse().map(fmt).join(' L')} Z`;
}

// The neck rises from the chest, sweeps out and up into the heart's lobe, and
// curls over so the head faces the centre with the beak pointing down.
const NECK = taperedPath(
  [
    [[93, 152], [52, 128], [33, 74], [60, 44]],
    [[60, 44], [72, 30], [90, 30], [92, 44]],
  ],
  15,
  7
);

const BODY =
  'M103 150 C103 163 90 171 68 171 C45 171 27 165 16 150 C28 155 38 155 47 151 C62 146 92 144 103 150 Z';

// The raised wing: three layers of feathers sweeping up and back.
const WING_BACK = 'M100 151 C86 126 56 104 18 96 C30 108 36 120 38 134 C30 128 21 126 12 127 C26 138 36 149 52 157 Z';
const WING_MID = 'M100 152 C88 133 64 117 32 110 C41 120 45 130 46 141 C40 137 33 136 27 137 C38 145 46 152 58 158 Z';
const WING_FRONT = 'M100 153 C90 140 72 129 48 125 C55 132 58 139 59 147 C54 145 49 145 44 146 C53 151 60 156 70 159 Z';

function head() {
  return [
    'g',
    {},
    [
      ['ellipse', { cx: 91.5, cy: 46, rx: 7.2, ry: 6.2, fill: C.feather, stroke: C.outline, strokeWidth: 1.2, transform: 'rotate(25 91.5 46)' }],
      // Re-cover where the neck joins the head, so no seam shows.
      ['circle', { cx: 88.4, cy: 42.6, r: 3.6, fill: C.feather }],
      // Beak: knob at the base, then the orange bill pointing down to the centre.
      ['path', { d: 'M94.6 47.2 L99.2 59.4 C96.6 59.8 94.2 57.8 92.6 51.6 Z', fill: C.beak, stroke: C.beakDeep, strokeWidth: 0.8, strokeLinejoin: 'round' }],
      ['path', { d: 'M92.2 45.6 C94.4 45 96 46.4 95.8 48.6 C94.2 49.6 92.4 49 91.8 47.6 Z', fill: C.knob }],
      ['circle', { cx: 90.2, cy: 44.6, r: 1.2, fill: C.eye }],
    ],
  ];
}

function swan() {
  return [
    'g',
    {},
    [
      ['path', { d: WING_BACK, fill: C.shade, stroke: C.outline, strokeWidth: 1.2, strokeLinejoin: 'round' }],
      ['path', { d: NECK, fill: C.feather, stroke: C.outline, strokeWidth: 1.2, strokeLinejoin: 'round' }],
      ['path', { d: BODY, fill: C.feather, stroke: C.outline, strokeWidth: 1.2, strokeLinejoin: 'round' }],
      ['path', { d: WING_MID, fill: C.feather, stroke: C.shadeDeep, strokeWidth: 1.1, strokeLinejoin: 'round' }],
      ['path', { d: WING_FRONT, fill: C.feather, stroke: C.shadeDeep, strokeWidth: 1.1, strokeLinejoin: 'round' }],
      // Cover the body outline where the neck rises out of it.
      ['path', { d: 'M86 149 C90 147 96 147 101 149 L101 153 L86 153 Z', fill: C.feather }],
      head(),
    ],
  ];
}

/** One swan: 'left' faces right, 'right' is its mirror. */
export function elegantSwan(side = 'left') {
  const art = swan();
  return side === 'right' ? ['g', { transform: 'translate(200 0) scale(-1 1)' }, [art]] : art;
}

/** The pool they float on. */
export function elegantWater() {
  return [
    'g',
    {},
    [
      ['ellipse', { cx: 100, cy: 174, rx: 92, ry: 7, fill: C.water }],
      ['ellipse', { cx: 100, cy: 172.5, rx: 74, ry: 4, fill: C.waterDeep, opacity: 0.55 }],
      ['ellipse', { cx: 100, cy: 182, rx: 56, ry: 3, fill: C.water, opacity: 0.8 }],
    ],
  ];
}

/** A small heart for the middle of the neck-heart. */
export function elegantHeart(x = 100, y = 96, s = 9) {
  return [
    'path',
    {
      d: `M${x} ${y + s * 0.9} C${x - s * 1.4} ${y} ${x - s * 0.9} ${y - s} ${x} ${y - s * 0.35} C${x + s * 0.9} ${y - s} ${x + s * 1.4} ${y} ${x} ${y + s * 0.9} Z`,
      fill: C.heart,
    },
  ];
}
