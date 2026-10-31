import { create } from 'zustand';

import { storage } from '../storage';

/**
 * Feature flags (slice K1): switch a feature off in a build, or on and off on
 * one phone for testing, without a code change.
 *
 * A flag's value comes from, in order:
 *  1. a device override, set on the Labs flags screen (`/labs/flags`) and
 *     kept on this phone only;
 *  2. the build, from `EXPO_PUBLIC_FLAGS`, e.g. `liveMode=off,visionPhotos=on`;
 *  3. the flag's default below.
 *
 * Screens read flags with `useFlag(key)`; code outside React with
 * `isEnabled(key)`. Overrides load just after start, so a flag overridden on
 * a phone can flip on the first screen; builds and defaults are known at once.
 *
 * Remote flags (turning a feature off for everyone without a release) need a
 * server and are not here yet; `resolveFlag` is where they would slot in.
 */

/** Every flag. Remove one once its feature is settled and the code is cleaned up. */
export const FLAGS = {
  liveMode: {
    title: 'Live mode on the day',
    description: 'The now / next card at the top of the run of show on its day (I1).',
    defaultValue: true,
  },
  runOfShowCues: {
    title: 'Cues on the day',
    description: '"In 10 min" reminders before each run-of-show item (I2).',
    defaultValue: true,
  },
  visionPhotos: {
    title: 'Vision board photos',
    description: 'Adding photos to vision board ideas (J1). Photos already added still show.',
    defaultValue: true,
  },
};

export const FLAG_KEYS = Object.keys(FLAGS);

const OVERRIDES_KEY = 'device:flagOverrides';
const ON = new Set(['on', 'true', '1', 'yes']);
const OFF = new Set(['off', 'false', '0', 'no']);

/**
 * Read a build's flags: `key=on,other=off`, spaces and case ignored. Unknown
 * keys and values are skipped, so a typo cannot switch on something else.
 */
export function parseBuildFlags(text) {
  const flags = {};
  for (const pair of String(text ?? '').split(',')) {
    const [rawKey, rawValue = ''] = pair.split('=').map((part) => part.trim());
    const key = FLAG_KEYS.find((name) => name.toLowerCase() === rawKey?.toLowerCase());
    const value = rawValue.toLowerCase();
    if (key && (ON.has(value) || OFF.has(value))) flags[key] = ON.has(value);
    else if (rawKey && __DEV__) console.warn(`[flags] Ignoring "${pair.trim()}" in EXPO_PUBLIC_FLAGS`);
  }
  return flags;
}

const buildFlags = parseBuildFlags(process.env.EXPO_PUBLIC_FLAGS);

/** `{ value, source }`, source being 'device', 'build' or 'default'. */
export function resolveFlag(key, { overrides = {}, build = buildFlags } = {}) {
  if (!FLAGS[key]) {
    if (__DEV__) throw new Error(`[flags] Unknown flag "${key}"`);
    return { value: false, source: 'default' };
  }
  if (typeof overrides[key] === 'boolean') return { value: overrides[key], source: 'device' };
  if (typeof build[key] === 'boolean') return { value: build[key], source: 'build' };
  return { value: FLAGS[key].defaultValue, source: 'default' };
}

const cleanOverrides = (value) =>
  Object.fromEntries(
    Object.entries(value && typeof value === 'object' ? value : {}).filter(
      ([key, on]) => FLAGS[key] && typeof on === 'boolean'
    )
  );

/**
 * Device overrides. Per phone, not per wedding, so they live in plain
 * storage rather than the workspace and never sync.
 */
export const useFlagStore = create((set, get) => ({
  overrides: {},

  async load() {
    try {
      set({ overrides: cleanOverrides(await storage.get(OVERRIDES_KEY)) });
    } catch {
      // No overrides is the safe state: the build and defaults apply.
    }
  },

  /** `value` true or false overrides the flag here; null goes back to the build's. */
  setOverride(key, value) {
    if (!FLAGS[key]) return;
    const overrides = { ...get().overrides };
    if (typeof value === 'boolean') overrides[key] = value;
    else delete overrides[key];
    set({ overrides });
    storage.set(OVERRIDES_KEY, overrides).catch(() => {});
  },

  clearOverrides() {
    set({ overrides: {} });
    storage.remove(OVERRIDES_KEY).catch(() => {});
  },
}));

/** Whether a feature is on, for code outside React. */
export function isEnabled(key) {
  return resolveFlag(key, { overrides: useFlagStore.getState().overrides }).value;
}

/** Whether a feature is on; re-renders when an override changes. */
export function useFlag(key) {
  return useFlagStore((state) => resolveFlag(key, { overrides: state.overrides }).value);
}
