/**
 * Store for travel module.
 * Follows WeddingGPT zustand + persist patterns.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../services/storage';

function emptyCol() {
  return { byId: {}, allIds: [] };
}
function upsert(col, entity) {
  const byId = { ...(col.byId || {}), [entity.id]: entity };
  const allIds = col.allIds?.includes(entity.id) ? col.allIds : [...(col.allIds || []), entity.id];
  return { byId, allIds };
}
function upsertMany(col, entities) {
  return (entities || []).reduce((c, e) => upsert(c, e), col || emptyCol());
}
function removeById(col, id) {
  const byId = { ...(col.byId || {}) };
  delete byId[id];
  return { byId, allIds: (col.allIds || []).filter((x) => x !== id) };
}
function touch(entity, patch) {
  return { ...entity, ...patch, updatedAt: Date.now() };
}
function denorm(col) {
  return (col?.allIds || []).map((id) => col.byId[id]).filter(Boolean);
}
function uid() {
  return Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
}

const initialState = {
  items: emptyCol(),
  meta: {},
};

export const useTravelStore = create()(
  persist(
    (set, get) => ({
      ...initialState,

      list() {
        return denorm(get().items);
      },

      getById(id) {
        return get().items.byId?.[id] || null;
      },

      create(partial = {}) {
        const entity = {
          id: uid(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ...partial,
        };
        set((s) => ({ items: upsert(s.items, entity) }));
        return entity;
      },

      update(id, patch) {
        const cur = get().items.byId?.[id];
        if (!cur) return null;
        const next = touch(cur, patch);
        set((s) => ({ items: upsert(s.items, next) }));
        return next;
      },

      remove(id) {
        set((s) => ({ items: removeById(s.items, id) }));
      },

      bulkCreate(list = []) {
        const entities = list.map((partial) => ({
          id: uid(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ...partial,
        }));
        set((s) => ({ items: upsertMany(s.items, entities) }));
        return entities;
      },

      setMeta(key, value) {
        set((s) => ({ meta: { ...s.meta, [key]: value } }));
      },

      getStats() {
        const items = denorm(get().items);
        return { count: items.length, meta: get().meta };
      },

      reset() {
        set(initialState);
      },
    }),
    {
      name: 'weddinggpt-travel',
      storage: zustandStorage,
      partialize: (s) => ({ items: s.items, meta: s.meta }),
    }
  )
);
