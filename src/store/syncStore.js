import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '../services/storage';
import { createId } from '../lib/id';
import { recordKey } from '../services/sync/changes';

/**
 * Sync bookkeeping for the active workspace (design M1 §4, slice A4).
 *
 * Persisted through the workspace-scoped adapter, so every workspace has its
 * own outbox and cursor, and switching workspaces switches these too.
 *
 *   outbox     local changes not yet accepted by the server, one per record
 *   known      the server version last seen for each record (the next push's
 *              baseVersion)
 *   cursor     the last server seq pulled
 *   conflicts  edits that overwrote someone else's - offered for restore
 *   rejected   changes the server refused, kept for support
 */

const MAX_CONFLICTS = 50;
const MAX_REJECTED = 50;

const initialState = {
  outbox: [],
  known: {},
  cursor: 0,
  conflicts: [],
  rejected: [],
  lastSyncedAt: null,
  lastError: null,
};

/**
 * Build a sync store. The app uses one persisted instance (`useSyncStore`);
 * tests build unpersisted ones to simulate several devices.
 */
export function createSyncStore({ persisted = true } = {}) {
  const config = (set, get) => ({
    ...initialState,

    /**
     * Queue changes `[{ collection, id, op, data }]`. A record with a change
     * already queued keeps one entry: the newest.
     */
    enqueue(changes = []) {
      if (!changes.length) return;
      const { known } = get();
      const now = new Date().toISOString();
      const replaced = new Set(changes.map((change) => recordKey(change.collection, change.id)));
      const outbox = get().outbox.filter((entry) => !replaced.has(recordKey(entry.collection, entry.id)));
      for (const change of changes) {
        outbox.push({
          mutationId: createId('mut'),
          collection: change.collection,
          id: change.id,
          op: change.op,
          data: change.op === 'upsert' ? change.data : undefined,
          baseVersion: known[recordKey(change.collection, change.id)] ?? 0,
          queuedAt: now,
        });
      }
      set({ outbox });
    },

    /**
     * Record the server's answer to a push of `sent`. Applied changes leave
     * the outbox; a newer change to the same record, queued while this push
     * was in flight, is rebased onto the new version so it does not conflict
     * with our own earlier edit.
     */
    markPushed(sent, { applied = [], conflicts = [], rejected = [] }) {
      const byMutation = new Map(sent.map((entry) => [entry.mutationId, entry]));
      const known = { ...get().known };
      const done = new Set();

      for (const result of applied) {
        const entry = byMutation.get(result.mutationId);
        if (!entry) continue;
        known[recordKey(entry.collection, entry.id)] = result.version;
        done.add(result.mutationId);
      }

      const refused = [];
      for (const result of rejected) {
        const entry = byMutation.get(result.mutationId);
        if (!entry) continue;
        done.add(result.mutationId);
        refused.push({
          collection: entry.collection,
          id: entry.id,
          op: entry.op,
          error: result.error,
          at: new Date().toISOString(),
        });
      }

      const notices = [];
      for (const result of conflicts) {
        const entry = byMutation.get(result.mutationId);
        if (!entry) continue;
        notices.push({
          id: createId('conflict'),
          collection: entry.collection,
          recordId: entry.id,
          overwritten: result.overwritten,
          at: new Date().toISOString(),
        });
      }

      const outbox = get()
        .outbox.filter((entry) => !done.has(entry.mutationId))
        .map((entry) => {
          const version = known[recordKey(entry.collection, entry.id)];
          return version !== undefined && version > entry.baseVersion
            ? { ...entry, baseVersion: version }
            : entry;
        });

      set({
        outbox,
        known,
        conflicts: [...notices, ...get().conflicts].slice(0, MAX_CONFLICTS),
        rejected: [...refused, ...get().rejected].slice(0, MAX_REJECTED),
      });
    },

    /** After a pull page: remember server versions and move the cursor. */
    markPulled(records, cursor) {
      const known = { ...get().known };
      for (const record of records) known[recordKey(record.collection, record.id)] = record.version;
      set({ known, cursor: Math.max(get().cursor, cursor) });
    },

    setResult({ syncedAt = null, error = null }) {
      set(error ? { lastError: error } : { lastError: null, lastSyncedAt: syncedAt });
    },

    dismissConflict(id) {
      set({ conflicts: get().conflicts.filter((conflict) => conflict.id !== id) });
    },

    reset() {
      set({ ...initialState });
    },
  });

  if (!persisted) return create()(config);

  return create()(
    persist(config, {
      name: 'sync:state',
      storage: zustandStorage,
      version: 1,
      partialize: (state) => ({
        outbox: state.outbox,
        known: state.known,
        cursor: state.cursor,
        conflicts: state.conflicts,
        rejected: state.rejected,
        lastSyncedAt: state.lastSyncedAt,
      }),
    })
  );
}

export const useSyncStore = createSyncStore();

export const selectPendingCount = (state) => state.outbox.length;
export const selectConflicts = (state) => state.conflicts;
export const selectLastSyncedAt = (state) => state.lastSyncedAt;
export const selectLastSyncError = (state) => state.lastError;
