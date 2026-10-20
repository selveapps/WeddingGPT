import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '../services/storage';
import {
  createVendor,
  denormalise,
  emptyCollection,
  removeById,
  touchEntity,
  upsert,
} from '../models';

const initialState = { vendors: emptyCollection() };
export const VENDOR_STORAGE_KEY = 'profile:bookings';

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
        const vendor = touchEntity(existing, patch);
        set((state) => ({ vendors: upsert(state.vendors, vendor) }));
        return vendor;
      },

      deleteVendor(id) {
        if (!get().vendors.byId[id]) return false;
        set((state) => ({ vendors: removeById(state.vendors, id) }));
        return true;
      },

      reset() {
        set({ vendors: emptyCollection() });
      },
    }),
    {
      name: VENDOR_STORAGE_KEY,
      storage: zustandStorage,
      version: 1,
      partialize: (state) => ({ vendors: state.vendors }),
    }
  )
);

export const selectAllVendors = (state) => denormalise(state.vendors);
export const selectVendorById = (id) => (state) => state.vendors.byId[id] ?? null;
