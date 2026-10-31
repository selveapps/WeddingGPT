import { create } from 'zustand';

import { storage } from '../storage';
import { createApiRequest } from '../api/request';

/**
 * Feature flags (slice K1): switch a feature off in a build, or on and off on
 * one phone for testing, without a code change.
 *
 * A flag's value comes from, in order:
 *  1. a device override, set on the Labs flags screen (`/labs/flags`) and
 *     kept on this phone only;
 *  2. the server's (K1b): `GET /v1/flags` on the account server, set there
 *     with `REMOTE_FLAGS`, so a feature can be switched off for everyone
 *     without a release. Fetched at start and kept for offline starts;
 *  3. the build, from `EXPO_PUBLIC_FLAGS`, e.g. `liveMode=off,visionPhotos=on`;
 *  4. the flag's default below.
 *
 * Screens read flags with `useFlag(key)`; code outside React with
 * `isEnabled(key)`. Overrides and the server's flags load just after start,
 * so they can flip a flag on the first screen; builds and defaults are known
 * at once.
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
const REMOTE_KEY = 'device:remoteFlags';
const REMOTE_TIMEOUT_MS = 5000;
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

/** The account server's flags, when this build has one (`EXPO_PUBLIC_AUTH_URL`). */
const serverUrl = process.env.EXPO_PUBLIC_AUTH_URL;
const serverRequest = serverUrl
  ? createApiRequest({
      url: serverUrl,
      appToken: process.env.EXPO_PUBLIC_AUTH_APP_TOKEN,
      timeoutMs: REMOTE_TIMEOUT_MS,
    })
  : null;

/** `{ value, source }`, source being 'device', 'remote', 'build' or 'default'. */
export function resolveFlag(key, { overrides = {}, remote = {}, build = buildFlags } = {}) {
  if (!FLAGS[key]) {
    if (__DEV__) throw new Error(`[flags] Unknown flag "${key}"`);
    return { value: false, source: 'default' };
  }
  if (typeof overrides[key] === 'boolean') return { value: overrides[key], source: 'device' };
  if (typeof remote[key] === 'boolean') return { value: remote[key], source: 'remote' };
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
 * Device overrides and the server's flags. Per phone, not per wedding, so
 * they live in plain storage rather than the workspace and never sync.
 */
export const useFlagStore = create((set, get) => ({
  overrides: {},
  remote: {},

  /** This phone's overrides and the last server flags, then fresh ones. */
  async load({ request = serverRequest } = {}) {
    try {
      const [overrides, remote] = await Promise.all([storage.get(OVERRIDES_KEY), storage.get(REMOTE_KEY)]);
      set({ overrides: cleanOverrides(overrides), remote: cleanOverrides(remote) });
    } catch {
      // Nothing saved is the safe state: the build and defaults apply.
    }
    await get().refreshRemote({ request });
  },

  /**
   * Ask the server for its flags. Offline, or on any error, the last ones
   * stay; names this version of the app does not know are dropped.
   */
  async refreshRemote({ request = serverRequest } = {}) {
    if (!request) return;
    try {
      const response = await request('/v1/flags');
      const remote = cleanOverrides(response?.flags);
      set({ remote });
      await storage.set(REMOTE_KEY, remote);
    } catch {
      // Keep what we had.
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
  const { overrides, remote } = useFlagStore.getState();
  return resolveFlag(key, { overrides, remote }).value;
}

/** Whether a feature is on; re-renders when an override changes. */
export function useFlag(key) {
  return useFlagStore(
    (state) => resolveFlag(key, { overrides: state.overrides, remote: state.remote }).value
  );
}
