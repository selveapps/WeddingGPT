/**
 * Workspace-scoped persistence (design M1, slice A3).
 *
 * Every persisted store writes through one adapter, so scoping that adapter
 * scopes them all. Keys are `ws:<workspaceId>:<store>`, except for the
 * `local` workspace - the signed-out, on-this-phone workspace every user has
 * today - which keeps the original unprefixed keys. Existing data therefore
 * needs no migration: it already *is* the local workspace.
 *
 * Switching workspaces is the dangerous part. zustand's `persist` keeps the
 * in-memory state when a key has nothing saved, and the next edit would then
 * write wedding A's data under wedding B. So a switch pauses writes, empties
 * every registered store, points storage at the new workspace, reloads, and
 * only then resumes writes.
 */

export const LOCAL_WORKSPACE = 'local';
export const ACTIVE_WORKSPACE_KEY = 'workspace:active';

const WORKSPACE_PREFIX = 'ws:';

export function workspaceKey(workspaceId, name) {
  return workspaceId === LOCAL_WORKSPACE ? name : `${WORKSPACE_PREFIX}${workspaceId}:${name}`;
}

const isValidWorkspaceId = (id) => typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id);

/**
 * @param storage  a StorageService (get/set/remove/removeMany/keys)
 */
export function createWorkspaceStorage(storage) {
  let active = LOCAL_WORKSPACE;
  let paused = false;
  let isReady = false;
  const stores = new Set();
  const listeners = new Set();

  // Stores start hydrating the moment they are created, before we know which
  // workspace was active last time, so every read and write waits for this.
  const ready = (async () => {
    try {
      const saved = await storage.get(ACTIVE_WORKSPACE_KEY);
      if (isValidWorkspaceId(saved)) active = saved;
    } catch {
      // Unreadable: stay on the local workspace, which is today's behaviour.
    } finally {
      isReady = true;
    }
  })();

  /** The key for `name` in the active workspace, fixed at call time. */
  async function keyFor(name) {
    if (!isReady) await ready;
    return workspaceKey(active, name);
  }

  function resetStores() {
    for (const store of stores) store.setState(store.getInitialState(), true);
  }

  /** The persist adapter every store passes as `storage`. */
  const adapter = {
    async getItem(name) {
      const value = await storage.get(await keyFor(name));
      return value ?? null;
    },
    async setItem(name, value) {
      if (paused) return;
      const key = await keyFor(name);
      if (!paused) await storage.set(key, value);
    },
    async removeItem(name) {
      if (paused) return;
      const key = await keyFor(name);
      if (!paused) await storage.remove(key);
    },
  };

  return {
    adapter,
    ready,

    /** Add a persisted store to the set that switches with the workspace. */
    register(store) {
      stores.add(store);
      return store;
    },

    registeredStores() {
      return [...stores];
    },

    getActive() {
      return active;
    },

    /** `listener(workspaceId)` after each switch. Returns an unsubscribe. */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    /**
     * Make `workspaceId` the active workspace and reload every registered
     * store from it. Resolves once the stores hold only the new workspace.
     */
    async switchTo(workspaceId) {
      if (!isValidWorkspaceId(workspaceId)) throw new Error(`Invalid workspace id: ${workspaceId}`);
      await ready;
      if (workspaceId === active) return;

      paused = true;
      try {
        resetStores();
        active = workspaceId;
        await storage.set(ACTIVE_WORKSPACE_KEY, workspaceId);
        await Promise.all([...stores].map((store) => store.persist.rehydrate()));
      } finally {
        paused = false;
      }
      listeners.forEach((listener) => listener(workspaceId));
    },

    /**
     * Delete everything saved for a workspace on this device. Clearing the
     * active workspace also empties the stores. Used when signing out wipes the
     * synced copy (decision D6) and when a workspace is left.
     */
    async clear(workspaceId) {
      if (!isValidWorkspaceId(workspaceId)) throw new Error(`Invalid workspace id: ${workspaceId}`);
      await ready;

      let keys;
      if (workspaceId === LOCAL_WORKSPACE) {
        keys = [...stores].map((store) => store.persist.getOptions().name);
      } else {
        const prefix = workspaceKey(workspaceId, '');
        keys = (await storage.keys()).filter((key) => key.startsWith(prefix));
      }

      const clearingActive = workspaceId === active;
      if (clearingActive) {
        paused = true;
        resetStores();
      }
      try {
        await storage.removeMany(keys);
      } finally {
        if (clearingActive) paused = false;
      }
      return keys.length;
    },
  };
}
