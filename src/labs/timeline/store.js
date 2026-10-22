import { denormalise, touchEntity, upsertMany } from '@/models';

import { createCollectionStore } from '../shared/createCollectionStore';
import { SAMPLE_DAY, shiftFrom } from './model';

export const useLabTimelineStore = createCollectionStore({
  key: 'timeline',
  prefix: 'levent',
  extend: (set, get) => ({
    loadSample() {
      return get().addMany(SAMPLE_DAY.map((event) => ({ location: '', ...event })));
    },

    shift(eventId, minutes) {
      const { items } = get();
      const changes = shiftFrom(denormalise(items), eventId, minutes);
      if (!changes.length) return 0;
      set((state) => ({
        items: upsertMany(
          state.items,
          changes.map((change) => touchEntity(state.items.byId[change.id], { start: change.start }))
        ),
      }));
      return changes.length;
    },
  }),
});
