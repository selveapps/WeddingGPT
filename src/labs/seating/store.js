import { denormalise, touchEntity, upsertMany } from '@/models';

import { createCollectionStore } from '../shared/createCollectionStore';
import { assignGuest, autoSeat, unassignGuest } from './model';

/**
 * Tables are the collection; `meta.avoidPairs` holds `[guestIdA, guestIdB]`
 * pairs that must not share a table.
 */
export const useLabSeatingStore = createCollectionStore({
  key: 'seating',
  prefix: 'ltable',
  extend: (set, get) => {
    /** Persist only the tables whose seating actually changed. */
    const commit = (before, after) => {
      const changed = after
        .filter((table, index) => table.guestIds !== before[index].guestIds)
        .map((table) => touchEntity(before.find((b) => b.id === table.id), { guestIds: table.guestIds }));
      if (changed.length) set((state) => ({ items: upsertMany(state.items, changed) }));
    };

    return {
      assign(tableId, guestId) {
        const before = denormalise(get().items);
        const result = assignGuest(before, tableId, guestId);
        if (!result.error) commit(before, result.tables);
        return result;
      },

      unassign(guestId) {
        const before = denormalise(get().items);
        commit(before, unassignGuest(before, guestId));
      },

      autoSeat(guests) {
        const before = denormalise(get().items);
        const result = autoSeat(before, guests, { avoidPairs: get().meta.avoidPairs ?? [] });
        const changed = result.tables.filter(
          (table, index) => table.guestIds.length !== before[index].guestIds.length
        );
        if (changed.length) {
          set((state) => ({
            items: upsertMany(
              state.items,
              changed.map((table) => touchEntity(before.find((b) => b.id === table.id), { guestIds: table.guestIds }))
            ),
          }));
        }
        return result;
      },

      addAvoidPair(a, b) {
        if (!a || !b || a === b) return;
        const pairs = get().meta.avoidPairs ?? [];
        get().setMeta({ avoidPairs: [...pairs, [a, b]] });
      },

      removeAvoidPair(index) {
        const pairs = [...(get().meta.avoidPairs ?? [])];
        pairs.splice(index, 1);
        get().setMeta({ avoidPairs: pairs });
      },
    };
  },
});
