/**
 * Zustand store for Kids & Family Coordinator.
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
  secondary: emptyCol(),
  meta: {},
};

export const useKidsCrewStore = create()(
  persist(
    (set, get) => ({
      ...initialState,

      list() {
        return denorm(get().items);
      },

      listSecondary() {
        return denorm(get().secondary);
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

      createSecondary(partial = {}) {
        const entity = {
          id: uid(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ...partial,
        };
        set((s) => ({ secondary: upsert(s.secondary, entity) }));
        return entity;
      },

      update(id, patch) {
        const cur = get().items.byId?.[id];
        if (!cur) return null;
        const next = touch(cur, patch);
        set((s) => ({ items: upsert(s.items, next) }));
        return next;
      },

      updateSecondary(id, patch) {
        const cur = get().secondary.byId?.[id];
        if (!cur) return null;
        const next = touch(cur, patch);
        set((s) => ({ secondary: upsert(s.secondary, next) }));
        return next;
      },

      remove(id) {
        set((s) => ({ items: removeById(s.items, id) }));
      },

      removeSecondary(id) {
        set((s) => ({ secondary: removeById(s.secondary, id) }));
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
        const secondary = denorm(get().secondary);
        return {
          count: items.length,
          secondaryCount: secondary.length,
          meta: get().meta,
        };
      },

      reset() {
        set(initialState);
      },
    }),
    {
      name: 'weddinggpt-kidsCrew',
      storage: zustandStorage,
      partialize: (s) => ({ items: s.items, secondary: s.secondary, meta: s.meta }),
    }
  )
);
