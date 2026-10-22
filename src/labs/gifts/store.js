import { createCollectionStore } from '../shared/createCollectionStore';
import { nextThankYouStatus } from './model';

export const useLabGiftStore = createCollectionStore({
  key: 'gifts',
  prefix: 'lgift',
  extend: (set, get) => ({
    cycleThankYou(id) {
      return get().update(id, (gift) => ({ thankYouStatus: nextThankYouStatus(gift.thankYouStatus) }));
    },
  }),
});
