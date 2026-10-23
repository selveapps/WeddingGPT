import { allAsUpserts, applyRecords, diffSlice, recordKey } from './changes';
import { RETRYABLE_SYNC_ERRORS, SyncError, SyncErrorCode } from './syncClient';

/**
 * The sync engine (design M1 §4, slice A4).
 *
 * It watches the synced store slices, queues every local change in the
 * outbox, and on `syncNow` pushes the outbox then pulls what others changed.
 *
 * Three things would silently destroy server data, so each is guarded:
 *
 *  1. Launch. Stores fill in from disk after they are created; watching them
 *     before that would read every record as new and re-upload the wedding on
 *     every launch. `attach` is called only after hydration, and takes its
 *     starting snapshot then.
 *  2. Workspace switches. A switch empties every store before reloading
 *     (A3), which looks exactly like "the couple deleted everything". All
 *     switches go through `whilePaused`, and the snapshot is retaken after.
 *  3. Our own pulls. Applying pulled records changes the stores; that is not
 *     a local edit, so it is applied with tracking off.
 */

const BATCH = 100;

export function createSyncEngine({
  client,
  syncStore,
  slices,
  getSession,
  onUnauthorised = () => {},
  onGone = () => {},
  debounceMs = 2000,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) {
  let snapshots = new Map();
  let unsubscribers = [];
  let paused = 0;
  let attached = false;
  let timer = null;
  let running = null;
  let rerun = false;

  const sliceValue = (slice) => slice.store.getState()[slice.key];
  const takeSnapshots = () => {
    snapshots = new Map(slices.map((slice) => [slice, sliceValue(slice)]));
  };
  const isActive = () => Boolean(getSession());

  function captureChanges(store) {
    if (paused) return;
    const changes = [];
    for (const slice of slices) {
      if (slice.store !== store) continue;
      const next = sliceValue(slice);
      for (const change of diffSlice(slice.kind, snapshots.get(slice), next)) {
        changes.push({ ...change, collection: slice.collection });
      }
      snapshots.set(slice, next);
    }
    if (!changes.length || !isActive()) return;
    syncStore.getState().enqueue(changes);
    schedule();
  }

  function schedule() {
    if (timer) clearTimer(timer);
    timer = setTimer(() => {
      timer = null;
      engine.syncNow();
    }, debounceMs);
  }

  /** Apply pulled records to the stores, one setState per store, without tracking them. */
  function applyPulled(records) {
    const pending = new Set(
      syncStore.getState().outbox.map((entry) => recordKey(entry.collection, entry.id))
    );
    const fresh = records.filter((record) => !pending.has(recordKey(record.collection, record.id)));
    const patches = new Map();

    for (const slice of slices) {
      const forSlice = fresh.filter((record) => record.collection === slice.collection);
      if (!forSlice.length) continue;
      const patch = patches.get(slice.store) ?? {};
      patch[slice.key] = applyRecords(slice.kind, patch[slice.key] ?? sliceValue(slice), forSlice);
      patches.set(slice.store, patch);
    }

    paused += 1;
    try {
      for (const [store, patch] of patches) store.setState(patch);
    } finally {
      paused -= 1;
    }
    for (const slice of slices) snapshots.set(slice, sliceValue(slice));

    // Records we skipped keep their old known version, so our pending push
    // is checked against what we last saw and a conflict is reported.
    return fresh;
  }

  async function runSync() {
    const session = getSession();
    if (!session) return { skipped: true };
    const { token, workspaceId } = session;
    const store = syncStore.getState;

    try {
      // Push everything queued, in batches.
      for (;;) {
        const batch = store().outbox.slice(0, BATCH);
        if (!batch.length) break;
        const result = await client.push(
          token,
          workspaceId,
          batch.map(({ mutationId, collection, id, op, baseVersion, data }) => ({
            mutationId,
            collection,
            id,
            op,
            baseVersion,
            ...(op === 'upsert' ? { data } : {}),
          }))
        );
        store().markPushed(batch, result);
        if (getSession()?.workspaceId !== workspaceId) return { skipped: true };
      }

      // Pull what changed since the cursor.
      let pulled = 0;
      for (;;) {
        const page = await client.pull(token, workspaceId, { since: store().cursor });
        if (getSession()?.workspaceId !== workspaceId) return { skipped: true };
        const fresh = applyPulled(page.records);
        store().markPulled(fresh, page.cursor);
        pulled += page.records.length;
        if (!page.hasMore) break;
      }

      store().setResult({ syncedAt: new Date().toISOString() });
      return { pulled, pending: store().outbox.length };
    } catch (error) {
      const code = error instanceof SyncError ? error.code : SyncErrorCode.UNAVAILABLE;
      store().setResult({ error: code });
      if (code === SyncErrorCode.UNAUTHORISED) onUnauthorised();
      if (code === SyncErrorCode.GONE) onGone(workspaceId);
      return { error: code, retryable: RETRYABLE_SYNC_ERRORS.includes(code) };
    }
  }

  const engine = {
    /** Start watching the stores. Call once the stores have hydrated. */
    attach() {
      if (attached) return;
      attached = true;
      takeSnapshots();
      const stores = [...new Set(slices.map((slice) => slice.store))];
      unsubscribers = stores.map((store) => store.subscribe(() => captureChanges(store)));
    },

    detach() {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      unsubscribers = [];
      attached = false;
      if (timer) clearTimer(timer);
      timer = null;
    },

    /**
     * Run `fn` (a workspace switch, a bulk copy) with change tracking off,
     * then start tracking again from whatever the stores now hold.
     */
    async whilePaused(fn) {
      paused += 1;
      try {
        return await fn();
      } finally {
        paused -= 1;
        takeSnapshots();
      }
    },

    /** Queue every synced entity, for the first upload of a new workspace. */
    seedAll() {
      const changes = slices.flatMap((slice) =>
        allAsUpserts(slice.kind, sliceValue(slice)).map((change) => ({
          ...change,
          collection: slice.collection,
        }))
      );
      syncStore.getState().enqueue(changes);
      return changes.length;
    },

    /**
     * Push then pull. One sync at a time: a call while one is running makes
     * it run once more when it finishes, so nothing queued meanwhile waits.
     */
    async syncNow() {
      if (running) {
        rerun = true;
        return running;
      }
      running = (async () => {
        let result;
        do {
          rerun = false;
          result = await runSync();
        } while (rerun && !result.error);
        return result;
      })();
      try {
        return await running;
      } finally {
        running = null;
      }
    },

    /**
     * Put back the version a push overwrote. It goes through the store like
     * any edit, so it is queued and synced as one.
     */
    restoreConflict(conflict) {
      const slice = slices.find((candidate) => candidate.collection === conflict.collection);
      if (!slice) return false;
      const { overwritten } = conflict;
      const record = {
        id: conflict.recordId,
        deletedAt: overwritten?.deletedAt ?? null,
        data: overwritten?.data ?? null,
      };
      if (!record.deletedAt && !record.data) return false;
      slice.store.setState({ [slice.key]: applyRecords(slice.kind, sliceValue(slice), [record]) });
      syncStore.getState().dismissConflict(conflict.id);
      return true;
    },

    isAttached: () => attached,
  };

  return engine;
}
