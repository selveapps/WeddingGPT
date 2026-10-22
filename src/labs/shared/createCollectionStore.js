import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/services/storage';
import {
  createEntity,
  touchEntity,
  emptyCollection,
  upsert,
  upsertMany,
  removeById,
  denormalise,
} from '@/models';

/**
 * A persisted store holding one normalised collection plus a small `meta` bag.
 *
 * Every Labs feature keeps its own data under a `labs:<key>` storage key, so a
 * prototype can be tried, reset or deleted without touching the real
 * workspace stores. Items go through `createEntity` / `touchEntity` like the
 * rest of the app, so promoting a feature later is a move, not a migration.
 *
 * `extend(set, get)` adds feature-specific actions on top of the CRUD ones.
 * `update` accepts either a patch or a function of the current item.
 */
export function createCollectionStore({ key, prefix, version = 1, extend }) {
  const initial = () => ({ items: emptyCollection(), meta: {} });

  return create()(
    persist(
      (set, get) => ({
        ...initial(),

        add(fields = {}) {
          const item = createEntity(prefix, fields);
          set((state) => ({ items: upsert(state.items, item) }));
          return item;
        },

        addMany(list = []) {
          const items = list.map((fields) => createEntity(prefix, fields));
          if (!items.length) return [];
          set((state) => ({ items: upsertMany(state.items, items) }));
          return items;
        },

        update(id, patch) {
          const existing = get().items.byId[id];
          if (!existing) return null;
          const fields = typeof patch === 'function' ? patch(existing) : patch;
          const next = touchEntity(existing, fields);
          set((state) => ({ items: upsert(state.items, next) }));
          return next;
        },

        remove(id) {
          set((state) => ({ items: removeById(state.items, id) }));
        },

        setMeta(patch) {
          set((state) => ({ meta: { ...state.meta, ...patch } }));
        },

        reset() {
          set(initial());
        },

        ...(extend ? extend(set, get) : {}),
      }),
      {
        name: `labs:${key}`,
        storage: zustandStorage,
        version,
        partialize: (state) => ({ items: state.items, meta: state.meta }),
      }
    )
  );
}

/** Items in insertion order, with a stable reference (see `denormalise`). */
export const selectItems = (state) => denormalise(state.items);
export const selectMeta = (state) => state.meta;
