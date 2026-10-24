/**
 * Shared constants, labels, and pure helpers for WeddingGPT extensions.
 * Intentionally verbose for documentation and future i18n extraction.
 */

export const EXTENSION_MODULE_IDS = [
  'photoAlbum',
  'music',
  'menu',
  'travel',
  'documents',
  'weather',
  'speeches',
  'attire',
  'guestExperience',
  'analytics',
];

export const EXTENSION_MODULE_META = {
  photoAlbum: {
    id: 'photoAlbum',
    title: 'Photo Album',
    route: '/photo-album',
    description: 'Albums, memories, and guest sharing for wedding photos.',
    emoji: '📸',
    phase: 4,
  },
  music: {
    id: 'music',
    title: 'Music & Entertainment',
    route: '/music',
    description: 'Playlists, must-play lists, and DJ handoff sheets.',
    emoji: '🎵',
    phase: 4,
  },
  menu: {
    id: 'menu',
    title: 'Menu & Catering',
    route: '/menu',
    description: 'Courses, dishes, dietary coverage, and tasting notes.',
    emoji: '🍽️',
    phase: 4,
  },
  travel: {
    id: 'travel',
    title: 'Travel & Stays',
    route: '/travel',
    description: 'Room blocks, transport, flights, and local recommendations.',
    emoji: '✈️',
    phase: 4,
  },
  documents: {
    id: 'documents',
    title: 'Documents',
    route: '/documents',
    description: 'Marriage license, contracts, insurance, and file vault.',
    emoji: '📜',
    phase: 4,
  },
  weather: {
    id: 'weather',
    title: 'Weather & Contingency',
    route: '/weather',
    description: 'Forecast snapshots and outdoor backup plans.',
    emoji: '🌧️',
    phase: 4,
  },
  speeches: {
    id: 'speeches',
    title: 'Speeches & Toasts',
    route: '/speeches',
    description: 'Outlines, drafts, timing, and role templates.',
    emoji: '🎤',
    phase: 4,
  },
  attire: {
    id: 'attire',
    title: 'Outfit & Attire',
    route: '/attire',
    description: 'Couple and party looks, fittings, and palette.',
    emoji: '👗',
    phase: 4,
  },
  guestExperience: {
    id: 'guestExperience',
    title: 'Guest Experience',
    route: '/guest-experience',
    description: 'Welcome bags, kids corner, accessibility, hospitality.',
    emoji: '🎁',
    phase: 4,
  },
  analytics: {
    id: 'analytics',
    title: 'Analytics',
    route: '/analytics',
    description: 'Cross-module stats and planning health.',
    emoji: '📊',
    phase: 4,
  },
};

export function listExtensionModules() {
  return EXTENSION_MODULE_IDS.map((id) => EXTENSION_MODULE_META[id]);
}

export function getModuleByRoute(route) {
  return listExtensionModules().find((m) => m.route === route) || null;
}

/** Format bytes for photo storage UI */
export function formatBytes(n) {
  if (n == null || n < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

/** Safe date formatting for lists */
export function formatShortDate(value, fallback = '—') {
  if (!value) return fallback;
  try {
    const d = typeof value === 'number' ? new Date(value) : new Date(value);
    if (Number.isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return fallback;
  }
}

/** Clamp helper used by duration and budget UIs */
export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/** Generate a stable-ish client id (not crypto) */
export function clientId(prefix = 'ext') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

// --- Long form copy used by empty states / onboarding tips -----------------

export const EXTENSION_TIPS = {
  photoAlbum: [
    'Pin your engagement album so it always appears first on the home widget.',
    'Tag people early — it makes guest-facing albums more personal.',
    'Use “memories” for timeline moments that are not full albums.',
    'Share links can expire; set an expiry if you only want day-of access.',
  ],
  music: [
    'Lock the first dance and last song early so the DJ can plan transitions.',
    'Keep the do-not-play list short and specific (artist + title).',
    'Export the DJ sheet the week before and attach it to the vendor chat.',
    'Cocktail hour energy is usually softer than reception — split playlists.',
  ],
  menu: [
    'Map dietary tags to dishes before you send the final headcount.',
    'Record tasting scores the same day so notes stay accurate.',
    'Kids and late-night stations are easy to forget in the per-head number.',
  ],
  travel: [
    'Publish the room block code and deadline on the wedding website.',
    'Shuttle capacity should include buffers for +1s and timing slips.',
    'Local recommendations help out-of-town guests fill free time.',
  ],
  documents: [
    'Marriage license validity windows vary by jurisdiction — check early.',
    'Store vendor contracts with the related vendor id for quick lookup.',
    'Set reminder days so critical items surface on the home timeline.',
  ],
  weather: [
    'Write the decision rule in plain language (“if rain at T-6h, move indoors”).',
    'Assign one owner for the go/no-go call so the day-of team is not confused.',
    'Heat plans often need extra budget for shade and hydration.',
  ],
  speeches: [
    'Target 3 minutes unless the couple asks for longer.',
    'Practice standing up — seated read-throughs hide pacing issues.',
    'Coordinate stories between speakers to avoid repeats.',
  ],
  attire: [
    'Log fittings with location and date so reminders work.',
    'Share the palette with the florist and stationer for cohesion.',
    'Accessories have a way of being forgotten the morning of — checklist them.',
  ],
  guestExperience: [
    'Accessibility notes should be public on the website when possible.',
    'A simple kids table during dinner buys adults conversation time.',
    'Welcome bags do not need to be expensive — local and useful wins.',
  ],
  analytics: [
    'Use module getStats() helpers to build a single planning health score.',
    'Track completion %, not just counts, so empty modules stand out.',
  ],
};

export function tipsFor(moduleId) {
  return EXTENSION_TIPS[moduleId] || [];
}
