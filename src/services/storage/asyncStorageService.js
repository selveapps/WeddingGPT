import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage-backed implementation of the StorageService contract.
 *
 * Responsibilities the callers are deliberately freed from:
 *  - Namespacing every key, so a future multi-wedding or multi-user build can
 *    partition data by changing one prefix.
 *  - JSON encode/decode, including surviving corrupt values (a bad blob returns
 *    `null` and is logged rather than crashing the app on launch).
 *  - Reducing round trips via multiGet/multiSet.
 */

const NAMESPACE = 'wgpt:v1';

const scope = (key) => `${NAMESPACE}:${key}`;
const unscope = (key) => key.slice(NAMESPACE.length + 1);

function decode(raw, key) {
  if (raw === null || raw === undefined) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // A corrupt entry should not brick launch. Drop it and carry on.
    if (__DEV__) console.warn(`[storage] Unreadable value at "${key}" - discarding.`);
    return null;
  }
}

export function createAsyncStorageService() {
  return {
    async get(key) {
      const raw = await AsyncStorage.getItem(scope(key));
      return decode(raw, key);
    },

    async set(key, value) {
      if (value === undefined) {
        // Storing `undefined` would serialise to the string "undefined".
        await AsyncStorage.removeItem(scope(key));
        return;
      }
      await AsyncStorage.setItem(scope(key), JSON.stringify(value));
    },

    async remove(key) {
      await AsyncStorage.removeItem(scope(key));
    },

    async getMany(keys) {
      if (!keys.length) return {};
      const pairs = await AsyncStorage.multiGet(keys.map(scope));
      const out = {};
      for (const [scopedKey, raw] of pairs) {
        const key = unscope(scopedKey);
        out[key] = decode(raw, key);
      }
      return out;
    },

    async setMany(entries) {
      if (!entries.length) return;
      const encoded = entries
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [scope(key), JSON.stringify(value)]);
      if (encoded.length) await AsyncStorage.multiSet(encoded);
    },

    async removeMany(keys) {
      if (!keys.length) return;
      await AsyncStorage.multiRemove(keys.map(scope));
    },

    async keys() {
      const all = await AsyncStorage.getAllKeys();
      return all.filter((k) => k.startsWith(`${NAMESPACE}:`)).map(unscope);
    },

    /** Clears only this app's namespace - never the whole AsyncStorage bucket. */
    async clear() {
      const all = await AsyncStorage.getAllKeys();
      const ours = all.filter((k) => k.startsWith(`${NAMESPACE}:`));
      if (ours.length) await AsyncStorage.multiRemove(ours);
    },
  };
}

export default createAsyncStorageService;
