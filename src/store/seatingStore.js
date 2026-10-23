import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '../services/storage';
import {
  assignGuest,
  autoSeat,
  createSeatingRules,
  createSeatingTable,
  denormalise,
  emptyCollection,
  removeById,
  touchEntity,
  unassignGuest,
  upsert,
  upsertMany,
  withKnownGuests,
} from '../models';

/**
 * The seating chart (workstream D, graduated from Labs). Tables and the
 * keep-apart rules sync as `seatingTables` and `seatingRules`, so both
 * partners plan the same room.
 *
 * Only tables whose seating actually changed are written, so moving one guest
 * syncs two tables, not the whole plan.
 */

const initialState = {
  tables: emptyCollection(),
  /** `{ id, avoidPairs: [[guestIdA, guestIdB]] }`, created on first use. */
  rules: null,
  /** ISO time the Labs seating chart's data was imported, or null. */
  labsImportedAt: null,
};

export const useSeatingStore = create()(
  persist(
    (set, get) => {
      const tableList = () => denormalise(get().tables);

      /** Save the tables in `after` whose guests differ from `before`. */
      const commit = (before, after) => {
        const changed = after
          .filter((table, index) => table.guestIds !== before[index].guestIds)
          .map((table) =>
            touchEntity(
              before.find((b) => b.id === table.id),
              { guestIds: table.guestIds }
            )
          );
        if (changed.length) set((state) => ({ tables: upsertMany(state.tables, changed) }));
        return changed.length;
      };

      return {
        ...initialState,

        addTable(fields) {
          const table = createSeatingTable(fields);
          set((state) => ({ tables: upsert(state.tables, table) }));
          return table;
        },

        updateTable(id, { name, capacity }) {
          const existing = get().tables.byId[id];
          if (!existing) return null;
          const patch = {};
          if (name !== undefined) patch.name = name;
          if (capacity !== undefined) {
            // Never shrink a table below the guests already at it.
            patch.capacity = Math.max(existing.guestIds.length, createSeatingTable({ capacity }).capacity);
          }
          const table = touchEntity(existing, patch);
          set((state) => ({ tables: upsert(state.tables, table) }));
          return table;
        },

        removeTable(id) {
          set((state) => ({ tables: removeById(state.tables, id) }));
        },

        assign(tableId, guestId) {
          const before = tableList();
          const result = assignGuest(before, tableId, guestId);
          if (!result.error) commit(before, result.tables);
          return result;
        },

        unassign(guestId) {
          const before = tableList();
          commit(before, unassignGuest(before, guestId));
        },

        /** Seat everyone not yet seated; see `autoSeat`. */
        autoSeat(guests) {
          const before = tableList();
          const result = autoSeat(before, guests, { avoidPairs: get().rules?.avoidPairs ?? [] });
          commit(
            before,
            result.tables.map((table, index) =>
              table.guestIds.length === before[index].guestIds.length ? before[index] : table
            )
          );
          return result;
        },

        /** Free the seats of guests who were deleted from the list. */
        releaseMissingGuests(guestIds) {
          const before = tableList();
          return commit(before, withKnownGuests(before, new Set(guestIds)));
        },

        ensureRules(weddingId) {
          const existing = get().rules;
          if (existing) return existing;
          const rules = createSeatingRules({ weddingId });
          set({ rules });
          return rules;
        },

        addAvoidPair(weddingId, a, b) {
          if (!a || !b || a === b) return false;
          const rules = get().ensureRules(weddingId);
          const key = [a, b].sort().join('|');
          if (rules.avoidPairs.some((pair) => [...pair].sort().join('|') === key)) return false;
          set({ rules: touchEntity(rules, { avoidPairs: [...rules.avoidPairs, [a, b]] }) });
          return true;
        },

        removeAvoidPair(index) {
          const rules = get().rules;
          if (!rules) return;
          set({ rules: touchEntity(rules, { avoidPairs: rules.avoidPairs.filter((_, i) => i !== index) }) });
        },

        /** For the one-time Labs import. */
        importLabs({ weddingId, tables = [], avoidPairs = [] }) {
          const created = tables.map((table) =>
            createSeatingTable({
              weddingId,
              name: table.name || 'Table',
              capacity: table.capacity,
              guestIds: Array.isArray(table.guestIds) ? table.guestIds : [],
            })
          );
          if (created.length) set((state) => ({ tables: upsertMany(state.tables, created) }));
          for (const [a, b] of avoidPairs) get().addAvoidPair(weddingId, a, b);
          set({ labsImportedAt: new Date().toISOString() });
          return created.length;
        },

        reset() {
          set({ ...initialState, tables: emptyCollection() });
        },
      };
    },
    {
      name: 'seating:store',
      storage: zustandStorage,
      version: 1,
      partialize: (state) => ({
        tables: state.tables,
        rules: state.rules,
        labsImportedAt: state.labsImportedAt,
      }),
    }
  )
);

const NO_PAIRS = Object.freeze([]);
export const selectSeatingTables = (state) => denormalise(state.tables);
export const selectAvoidPairs = (state) => state.rules?.avoidPairs ?? NO_PAIRS;
