import { createAsyncStorageService } from './asyncStorageService';
import { createMemoryStorageService } from './memoryStorageService';
import { createWorkspaceStorage } from './workspaceStorage';

export { StorageKeys, SCHEMA_VERSION } from './StorageService';
export { createAsyncStorageService } from './asyncStorageService';
export { createMemoryStorageService } from './memoryStorageService';
export { LOCAL_WORKSPACE, workspaceKey, createWorkspaceStorage } from './workspaceStorage';

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
 * The active workspace's view of storage (see workspaceStorage.js). Signed
 * out, that is the `local` workspace with the original unprefixed keys.
 */
export const workspaceStorage = createWorkspaceStorage(storage);

/**
 * Adapter that lets zustand's `persist` middleware write through our
 * StorageService rather than talking to AsyncStorage directly, scoped to the
 * active workspace. Every persisted store must also call
 * `workspaceStorage.register(store)`, so it switches with the workspace.
 */
export const zustandStorage = workspaceStorage.adapter;

export default storage;
