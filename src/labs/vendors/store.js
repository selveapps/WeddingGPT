import { VendorStatus } from '@/models';

import { createCollectionStore } from '../shared/createCollectionStore';
import { nextStatus } from './model';

/** Lab vendors live under `labs:vendors`, apart from the real vendor store. */
export const useLabVendorStore = createCollectionStore({
  key: 'vendors',
  prefix: 'lvendor',
  extend: (set, get) => ({
    advance(id) {
      return get().update(id, (vendor) => {
        const status = nextStatus(vendor.status);
        return {
          status,
          bookedAt: status === VendorStatus.BOOKED ? new Date().toISOString() : vendor.bookedAt ?? null,
        };
      });
    },

    setStatus(id, status) {
      return get().update(id, { status });
    },

    togglePaid(vendorId, paymentId) {
      return get().update(vendorId, (vendor) => ({
        payments: (vendor.payments ?? []).map((payment) =>
          payment.id === paymentId
            ? { ...payment, paidAt: payment.paidAt ? null : new Date().toISOString() }
            : payment
        ),
      }));
    },
  }),
});
