import { createAsyncStorageService } from './asyncStorageService';
import { createMemoryStorageService } from './memoryStorageService';

export { StorageKeys, SCHEMA_VERSION } from './StorageService';
export { createAsyncStorageService } from './asyncStorageService';
export { createMemoryStorageService } from './memoryStorageService';

/**
 * The single StorageService instance the app uses.
 *
 * Resolved once at module load. If the native module is missing (bare web, a
 * broken install), we fall back to memory so the app still runs - the user just
 * loses persistence, which is far better than a white screen on launch.
 */
function resolveStorage() {
  try {
    return createAsyncStorageService();
  } catch (error) {
    if (__DEV__) {
      console.warn('[storage] AsyncStorage unavailable, falling back to memory.', error);
    }
    return createMemoryStorageService();
  }
}

export const storage = resolveStorage();

/**
 * Adapter that lets zustand's `persist` middleware write through our
 * StorageService rather than talking to AsyncStorage directly. Keeping the
 * indirection means swapping in a remote backend later touches this file only.
 */
export const zustandStorage = {
  getItem: async (name) => {
    const value = await storage.get(name);
    return value ?? null;
  },
  setItem: async (name, value) => {
    await storage.set(name, value);
  },
  removeItem: async (name) => {
    await storage.remove(name);
  },
};

export default storage;
