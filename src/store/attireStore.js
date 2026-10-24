/**
 * Full attire store – items, fittings, accessories, palettes, looks, pack list.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../services/storage';
import {
  createAttireItem, createFitting, createAccessory, createColorPalette,
  createLookBoard, createPackListItem, deriveAttireStats, groupAttireByRole,
  fittingsForItem, accessoriesForItem, nextFitting, AttireStatus,
} from '../models/attire';

function emptyCol() { return { byId: {}, allIds: [] }; }
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

const initialState = {
  items: emptyCol(),
  fittings: emptyCol(),
  accessories: emptyCol(),
  palettes: emptyCol(),
  looks: emptyCol(),
  packList: emptyCol(),
  meta: {},
};

export const useAttireStore = create()(
  persist(
    (set, get) => ({
      ...initialState,

      // --- items ---
      listItems: () => denorm(get().items),
      getItem: (id) => get().items.byId?.[id] || null,
      createItem: (partial = {}) => {
        const entity = createAttireItem(partial);
        set((s) => ({ items: upsert(s.items, entity) }));
        return entity;
      },
      updateItem: (id, patch) => {
        const cur = get().items.byId?.[id];
        if (!cur) return null;
        const next = touch(cur, patch);
        set((s) => ({ items: upsert(s.items, next) }));
        return next;
      },
      removeItem: (id) => {
        set((s) => ({
          items: removeById(s.items, id),
          fittings: { byId: Object.fromEntries(Object.entries(s.fittings.byId || {}).filter(([, f]) => f.attireItemId !== id)), allIds: (s.fittings.allIds || []).filter((fid) => s.fittings.byId[fid]?.attireItemId !== id) },
          accessories: { byId: Object.fromEntries(Object.entries(s.accessories.byId || {}).filter(([, a]) => a.attireItemId !== id)), allIds: (s.accessories.allIds || []).filter((aid) => s.accessories.byId[aid]?.attireItemId !== id) },
        }));
      },
      setItemStatus: (id, status) => get().updateItem(id, { status }),
      bulkCreateItems: (list = []) => {
        const entities = list.map((p) => createAttireItem(p));
        set((s) => ({ items: upsertMany(s.items, entities) }));
        return entities;
      },

      // --- fittings ---
      listFittings: () => denorm(get().fittings),
      getFitting: (id) => get().fittings.byId?.[id] || null,
      createFitting: (partial = {}) => {
        const entity = createFitting(partial);
        set((s) => ({ fittings: upsert(s.fittings, entity) }));
        return entity;
      },
      updateFitting: (id, patch) => {
        const cur = get().fittings.byId?.[id];
        if (!cur) return null;
        const next = touch(cur, patch);
        set((s) => ({ fittings: upsert(s.fittings, next) }));
        return next;
      },
      removeFitting: (id) => set((s) => ({ fittings: removeById(s.fittings, id) })),
      fittingsForItem: (itemId) => fittingsForItem(itemId, get().fittings),
      nextFitting: () => nextFitting(get().fittings),

      // --- accessories ---
      listAccessories: () => denorm(get().accessories),
      createAccessory: (partial = {}) => {
        const entity = createAccessory(partial);
        set((s) => ({ accessories: upsert(s.accessories, entity) }));
        return entity;
      },
      updateAccessory: (id, patch) => {
        const cur = get().accessories.byId?.[id];
        if (!cur) return null;
        const next = touch(cur, patch);
        set((s) => ({ accessories: upsert(s.accessories, next) }));
        return next;
      },
      removeAccessory: (id) => set((s) => ({ accessories: removeById(s.accessories, id) })),
      toggleAccessoryPacked: (id) => {
        const cur = get().accessories.byId?.[id];
        if (!cur) return null;
        return get().updateAccessory(id, { isPacked: !cur.isPacked });
      },
      accessoriesForItem: (itemId) => accessoriesForItem(itemId, get().accessories),

      // --- palettes ---
      listPalettes: () => denorm(get().palettes),
      createPalette: (partial = {}) => {
        const entity = createColorPalette(partial);
        set((s) => ({ palettes: upsert(s.palettes, entity) }));
        return entity;
      },
      updatePalette: (id, patch) => {
        const cur = get().palettes.byId?.[id];
        if (!cur) return null;
        const next = touch(cur, patch);
        set((s) => ({ palettes: upsert(s.palettes, next) }));
        return next;
      },
      removePalette: (id) => set((s) => ({ palettes: removeById(s.palettes, id) })),
      addSwatch: (paletteId, swatch) => {
        const cur = get().palettes.byId?.[paletteId];
        if (!cur) return null;
        const colors = [...(cur.colors || []), { id: `${Date.now()}`, ...swatch }];
        return get().updatePalette(paletteId, { colors });
      },
      removeSwatch: (paletteId, swatchId) => {
        const cur = get().palettes.byId?.[paletteId];
        if (!cur) return null;
        const colors = (cur.colors || []).filter((c) => c.id !== swatchId);
        return get().updatePalette(paletteId, { colors });
      },

      // --- looks ---
      listLooks: () => denorm(get().looks),
      createLook: (partial = {}) => {
        const entity = createLookBoard(partial);
        set((s) => ({ looks: upsert(s.looks, entity) }));
        return entity;
      },
      updateLook: (id, patch) => {
        const cur = get().looks.byId?.[id];
        if (!cur) return null;
        const next = touch(cur, patch);
        set((s) => ({ looks: upsert(s.looks, next) }));
        return next;
      },
      removeLook: (id) => set((s) => ({ looks: removeById(s.looks, id) })),

      // --- pack list ---
      listPackList: () => denorm(get().packList).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
      rebuildPackList: (weddingId) => {
        const items = denorm(get().items).filter((i) => !weddingId || i.weddingId === weddingId);
        const accessories = denorm(get().accessories);
        const rows = [];
        let order = 0;
        for (const item of items) {
          rows.push(createPackListItem({
            weddingId: item.weddingId, attireItemId: item.id,
            label: item.title || item.wearerName || 'Outfit', isPacked: item.status === AttireStatus.PACKED,
            sortOrder: order++,
          }));
          for (const acc of accessories.filter((a) => a.attireItemId === item.id)) {
            rows.push(createPackListItem({
              weddingId: item.weddingId, accessoryId: acc.id, attireItemId: item.id,
              label: acc.name, isPacked: !!acc.isPacked, sortOrder: order++,
            }));
          }
        }
        set({ packList: upsertMany(emptyCol(), rows) });
        return rows;
      },
      togglePackItem: (id) => {
        const cur = get().packList.byId?.[id];
        if (!cur) return null;
        const next = touch(cur, { isPacked: !cur.isPacked, packedAt: !cur.isPacked ? Date.now() : null });
        set((s) => ({ packList: upsert(s.packList, next) }));
        return next;
      },

      // --- selectors ---
      groupByRole: () => groupAttireByRole(get().items),
      getStats: () => deriveAttireStats(get().items, get().fittings, get().accessories),
      setMeta: (key, value) => set((s) => ({ meta: { ...s.meta, [key]: value } })),
      reset: () => set(initialState),
    }),
    {
      name: 'weddinggpt-attire-v2',
      storage: zustandStorage,
      partialize: (s) => ({
        items: s.items, fittings: s.fittings, accessories: s.accessories,
        palettes: s.palettes, looks: s.looks, packList: s.packList, meta: s.meta,
      }),
    }
  )
);
