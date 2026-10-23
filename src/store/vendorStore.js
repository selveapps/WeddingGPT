import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '../services/storage';
import {
  VendorStatus,
  createVendor,
  denormalise,
  emptyCollection,
  paymentsFromMilestones,
  removeById,
  touchEntity,
  upsert,
  upsertMany,
} from '../models';

/**
 * The couple's vendors: who they are talking to, what was quoted, what is
 * booked and what has been paid.
 *
 * The storage key predates the Vendors screens (the booking tracker was first
 * built under Profile), and is kept so nothing saved under it is lost.
 */

export const VENDOR_STORAGE_KEY = 'profile:bookings';

const initialState = {
  vendors: emptyCollection(),
  /** ISO time the Labs vendor manager's data was imported, or null. */
  labsImportedAt: null,
};

/**
 * Status changes carry side effects worth recording: when a vendor was booked,
 * and when they were last contacted.
 */
function statusPatch(vendor, status) {
  const now = new Date().toISOString();
  return {
    status,
    bookedAt: status === VendorStatus.BOOKED ? (vendor.bookedAt ?? now) : null,
    ...(status === VendorStatus.CONTACTED ? { lastContactedAt: now } : {}),
  };
}

/**
 * v1 kept the deposit and final balance as four flat fields. v2 keeps a
 * `payments` list, so a payment can be marked paid.
 */
export function migrateVendorState(persisted, version) {
  if (!persisted?.vendors || version >= 2) return persisted;
  const byId = {};
  for (const [id, vendor] of Object.entries(persisted.vendors.byId ?? {})) {
    const { depositAmount, depositDueAt, finalAmount, finalDueAt, ...rest } = vendor;
    byId[id] = {
      quotedAmount: null,
      quoteScope: '',
      quoteValidUntil: null,
      meetingAt: null,
      expenseId: null,
      ...rest,
      payments: Array.isArray(vendor.payments)
        ? vendor.payments
        : paymentsFromMilestones({
            quotedAmount: vendor.quotedAmount,
            depositAmount,
            depositDueAt,
            finalAmount,
            finalDueAt,
          }),
    };
  }
  return { ...persisted, vendors: { ...persisted.vendors, byId }, labsImportedAt: null };
}

export const useVendorStore = create()(
  persist(
    (set, get) => ({
      ...initialState,

      addVendor(input) {
        const vendor = createVendor(input);
        set((state) => ({ vendors: upsert(state.vendors, vendor) }));
        return vendor;
      },

      updateVendor(id, patch) {
        const existing = get().vendors.byId[id];
        if (!existing) return null;
        const fields = typeof patch === 'function' ? patch(existing) : patch;
        const changesStatus = fields.status && fields.status !== existing.status;
        const vendor = touchEntity(existing, {
          ...fields,
          ...(changesStatus ? statusPatch(existing, fields.status) : {}),
        });
        set((state) => ({ vendors: upsert(state.vendors, vendor) }));
        return vendor;
      },

      setStatus(id, status) {
        return get().updateVendor(id, { status });
      },

      /** Mark a payment paid today, or unpaid again. */
      togglePaymentPaid(vendorId, paymentId) {
        return get().updateVendor(vendorId, (vendor) => ({
          payments: (vendor.payments ?? []).map((payment) =>
            payment.id === paymentId
              ? { ...payment, paidAt: payment.paidAt ? null : new Date().toISOString() }
              : payment
          ),
        }));
      },

      deleteVendor(id) {
        if (!get().vendors.byId[id]) return false;
        set((state) => ({ vendors: removeById(state.vendors, id) }));
        return true;
      },

      /** Add several vendors at once, e.g. from the Labs import. */
      importVendors(list = []) {
        const vendors = list.map((fields) => createVendor(fields));
        if (vendors.length) set((state) => ({ vendors: upsertMany(state.vendors, vendors) }));
        return vendors;
      },

      markLabsImported() {
        set({ labsImportedAt: new Date().toISOString() });
      },

      reset() {
        set({ ...initialState, vendors: emptyCollection() });
      },
    }),
    {
      name: VENDOR_STORAGE_KEY,
      storage: zustandStorage,
      version: 2,
      migrate: migrateVendorState,
      partialize: (state) => ({ vendors: state.vendors, labsImportedAt: state.labsImportedAt }),
    }
  )
);

export const selectAllVendors = (state) => denormalise(state.vendors);
export const selectVendorById = (id) => (state) => state.vendors.byId[id] ?? null;
export const selectLabsImportedAt = (state) => state.labsImportedAt;
