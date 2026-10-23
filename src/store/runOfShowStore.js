import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '../services/storage';
import {
  RUN_OF_SHOW_LIMITS,
  SAMPLE_DAY,
  createRunOfShowItem,
  denormalise,
  emptyCollection,
  itemsForDay,
  removeById,
  removeManyById,
  shiftFrom,
  touchEntity,
  upsert,
  upsertMany,
} from '../models';

/**
 * The run of show (graduated from the Labs day-of timeline). Synced as
 * `runOfShow`; each item belongs to the wedding day or to one event, and
 * every action works on one day at a time.
 */

const initialState = {
  items: emptyCollection(),
  /** ISO time the Labs timeline's data was imported, or null. */
  labsImportedAt: null,
};

export const useRunOfShowStore = create()(
  persist(
    (set, get) => {
      const day = (eventId) => itemsForDay(denormalise(get().items), eventId);

      return {
        ...initialState,

        addItem(fields) {
          if (day(fields?.eventId ?? null).length >= RUN_OF_SHOW_LIMITS.perDay) return null;
          const item = createRunOfShowItem(fields);
          set((state) => ({ items: upsert(state.items, item) }));
          return item;
        },

        updateItem(id, patch) {
          const existing = get().items.byId[id];
          if (!existing) return null;
          // Re-run the factory's clamping on the edited fields.
          const clean = createRunOfShowItem({ ...existing, ...patch });
          const item = touchEntity(existing, {
            title: clean.title,
            start: clean.start,
            durationMin: clean.durationMin,
            location: clean.location,
            owner: clean.owner,
          });
          set((state) => ({ items: upsert(state.items, item) }));
          return item;
        },

        removeItem(id) {
          set((state) => ({ items: removeById(state.items, id) }));
        },

        /** Start a day from a typical wedding day. Only into an empty day. */
        loadSample({ weddingId, eventId = null }) {
          if (day(eventId).length) return 0;
          const created = SAMPLE_DAY.map((entry) => createRunOfShowItem({ ...entry, weddingId, eventId }));
          set((state) => ({ items: upsertMany(state.items, created) }));
          return created.length;
        },

        /** Push an item and everything after it on the same day. Returns how many moved. */
        shift(itemId, minutes) {
          const anchor = get().items.byId[itemId];
          if (!anchor) return 0;
          const changes = shiftFrom(day(anchor.eventId ?? null), itemId, minutes);
          if (!changes.length) return 0;
          set((state) => ({
            items: upsertMany(
              state.items,
              changes.map((change) => touchEntity(state.items.byId[change.id], { start: change.start }))
            ),
          }));
          return changes.length;
        },

        /** Clear one day. Returns how many items went. */
        clearDay(eventId = null) {
          const ids = day(eventId).map((item) => item.id);
          if (ids.length) set((state) => ({ items: removeManyById(state.items, ids) }));
          return ids.length;
        },

        /** Bring over the Labs timeline as the wedding day's run of show. */
        importLabs({ weddingId, items = [] }) {
          const created = items
            .filter((item) => item && typeof item.title === 'string' && item.title.trim())
            .filter((item) => Number.isFinite(item.start))
            .slice(0, RUN_OF_SHOW_LIMITS.perDay)
            .map((item) =>
              createRunOfShowItem({
                weddingId,
                title: item.title,
                start: item.start,
                durationMin: item.durationMin,
                location: item.location ?? '',
                owner: item.owner ?? '',
              })
            );
          if (created.length) set((state) => ({ items: upsertMany(state.items, created) }));
          set({ labsImportedAt: new Date().toISOString() });
          return created.length;
        },

        reset() {
          set({ ...initialState, items: emptyCollection() });
        },
      };
    },
    {
      name: 'runOfShow:store',
      storage: zustandStorage,
      version: 1,
      partialize: (state) => ({ items: state.items, labsImportedAt: state.labsImportedAt }),
    }
  )
);

export const selectRunOfShow = (state) => denormalise(state.items);
