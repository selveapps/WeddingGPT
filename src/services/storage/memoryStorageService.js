/**
 * In-memory StorageService. Used by tests and as a safety net if the native
 * AsyncStorage module is unavailable - the app degrades to a session-only
 * workspace rather than failing to boot.
 */
export function createMemoryStorageService(seed = {}) {
  const map = new Map(Object.entries(seed));
  const clone = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));

  return {
    async get(key) {
      return map.has(key) ? clone(map.get(key)) : null;
    },
    async set(key, value) {
      if (value === undefined) map.delete(key);
      else map.set(key, clone(value));
    },
    async remove(key) {
      map.delete(key);
    },
    async getMany(keys) {
      const out = {};
      for (const key of keys) out[key] = map.has(key) ? clone(map.get(key)) : null;
      return out;
    },
    async setMany(entries) {
      for (const [key, value] of entries) {
        if (value !== undefined) map.set(key, clone(value));
      }
    },
    async removeMany(keys) {
      for (const key of keys) map.delete(key);
    },
    async keys() {
      return [...map.keys()];
    },
    async clear() {
      map.clear();
    },
  };
}

export default createMemoryStorageService;
