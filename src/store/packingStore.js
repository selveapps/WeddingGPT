import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '../services/storage';
import {
  PACKING_LIMITS,
  createPackingItem,
  denormalise,
  emptyCollection,
  itemsFor,
  missingTemplateItems,
  removeById,
  templateItemId,
  templatePackingItems,
  touchEntity,
  upsert,
  upsertMany,
} from '../models';

/**
 * Packing lists (graduated from Labs). Synced as `packingItems`. Every action
 * works on one list; template items have stable ids (see `models/packing.js`).
 */

const initialState = {
  items: emptyCollection(),
  /** ISO time the Labs packing lists were imported, or null. */
  labsImportedAt: null,
};

export const usePackingStore = create()(
  persist(
    (set, get) => {
      const list = (listKey) => itemsFor(denormalise(get().items), listKey);
      /** Add items whose id is not already there, so a template never doubles up. */
      const addNew = (items) => {
        const fresh = items.filter((item) => !get().items.byId[item.id]);
        if (fresh.length) set((state) => ({ items: upsertMany(state.items, fresh) }));
        return fresh.length;
      };

      return {
        ...initialState,

        /** Fill a list from its template. Returns how many items were added. */
        startFromTemplate(listKey, weddingId) {
          return addNew(templatePackingItems(listKey, weddingId));
        },

        /** Put back template items the couple deleted. */
        restoreDefaults(listKey, weddingId) {
          const missing = missingTemplateItems(list(listKey), listKey).map((entry) =>
            createPackingItem({ ...entry, weddingId, id: templateItemId(listKey, entry.title) })
          );
          return addNew(missing);
        },

        addCustom(listKey, title, weddingId) {
          if (!String(title ?? '').trim() || list(listKey).length >= PACKING_LIMITS.perList) return null;
          const item = createPackingItem({ weddingId, listKey, title, custom: true });
          set((state) => ({ items: upsert(state.items, item) }));
          return item;
        },

        togglePacked(id) {
          const existing = get().items.byId[id];
          if (!existing) return null;
          const item = touchEntity(existing, { packed: !existing.packed });
          set((state) => ({ items: upsert(state.items, item) }));
          return item;
        },

        renameItem(id, title) {
          const existing = get().items.byId[id];
          const text = String(title ?? '')
            .trim()
            .slice(0, PACKING_LIMITS.titleChars);
          if (!existing || !text) return null;
          const item = touchEntity(existing, { title: text });
          set((state) => ({ items: upsert(state.items, item) }));
          return item;
        },

        removeItem(id) {
          set((state) => ({ items: removeById(state.items, id) }));
        },

        /** Undo a removal: put the item back as it was. */
        restoreItem(item) {
          if (!item?.id || get().items.byId[item.id]) return null;
          const restored = touchEntity(item, {});
          set((state) => ({ items: upsert(state.items, restored) }));
          return restored;
        },

        /** Untick a whole list, e.g. to pack again for the trip home. */
        unpackAll(listKey) {
          const packed = list(listKey).filter((item) => item.packed);
          if (packed.length) {
            set((state) => ({
              items: upsertMany(
                state.items,
                packed.map((item) => touchEntity(item, { packed: false }))
              ),
            }));
          }
          return packed.length;
        },

        /** Bring over Labs packing lists, keeping ticks. Template items get their stable ids. */
        importLabs({ weddingId, items = [] }) {
          const created = items
            .filter((item) => item && typeof item.title === 'string' && item.title.trim() && item.listKey)
            .map((item) =>
              createPackingItem({
                weddingId,
                listKey: item.listKey,
                title: item.title,
                packed: item.packed,
                custom: Boolean(item.custom),
                id: item.custom ? null : templateItemId(item.listKey, item.title),
              })
            );
          // De-duplicate by id; the last copy (with its tick) wins.
          const byId = new Map(created.map((item) => [item.id, item]));
          const count = addNew([...byId.values()]);
          set({ labsImportedAt: new Date().toISOString() });
          return count;
        },

        reset() {
          set({ ...initialState, items: emptyCollection() });
        },
      };
    },
    {
      name: 'packing:store',
      storage: zustandStorage,
      version: 1,
      partialize: (state) => ({ items: state.items, labsImportedAt: state.labsImportedAt }),
    }
  )
);

export const selectPackingItems = (state) => denormalise(state.items);
