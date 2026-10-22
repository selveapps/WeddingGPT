import { createCollectionStore } from '../shared/createCollectionStore';
import { cancelRenewal, purchase, startTrial } from './model';

/**
 * Test-mode entitlement. Lives in `meta` only: `{ entitlement, trialUsed }`.
 * Nothing here talks to an app store.
 */
export const useLabSubscriptionStore = createCollectionStore({
  key: 'subscriptions',
  prefix: 'lsub',
  extend: (set, get) => ({
    startTrial() {
      const result = startTrial({ trialUsed: Boolean(get().meta.trialUsed) });
      if (result.entitlement) get().setMeta({ entitlement: result.entitlement, trialUsed: true });
      return result;
    },

    purchase(planKey) {
      const result = purchase(planKey);
      if (result.entitlement) get().setMeta({ entitlement: result.entitlement });
      return result;
    },

    cancelRenewal() {
      get().setMeta({ entitlement: cancelRenewal(get().meta.entitlement) });
    },
  }),
});
