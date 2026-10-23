import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '../services/storage';
import {
  GIFT_LIMITS,
  ThankYouStatus,
  createGift,
  denormalise,
  emptyCollection,
  nextThankYouStatus,
  removeById,
  touchEntity,
  upsert,
  upsertMany,
} from '../models';
import { todayISO } from '../lib/date';

/**
 * Gifts and thank-you notes (graduated from Labs). Synced as `gifts`, so
 * whoever opens the parcel can log it and the other partner can write the note.
 */

const initialState = {
  gifts: emptyCollection(),
  /** ISO time the Labs gift tracker's data was imported, or null. */
  labsImportedAt: null,
};

/** Keep `thankedOn` honest with the status: set when thanked, cleared when not. */
const withThankedOn = (gift, status) => ({
  thankYouStatus: status,
  thankedOn: status === ThankYouStatus.SENT ? (gift.thankedOn ?? todayISO()) : null,
});

export const useGiftStore = create()(
  persist(
    (set, get) => ({
      ...initialState,

      addGift(fields) {
        if (get().gifts.allIds.length >= GIFT_LIMITS.perWedding) return null;
        const gift = createGift(fields);
        set((state) => ({ gifts: upsert(state.gifts, gift) }));
        return gift;
      },

      updateGift(id, patch) {
        const existing = get().gifts.byId[id];
        if (!existing) return null;
        const status = patch.thankYouStatus ?? existing.thankYouStatus;
        const gift = touchEntity(existing, { ...patch, ...withThankedOn(existing, status) });
        set((state) => ({ gifts: upsert(state.gifts, gift) }));
        return gift;
      },

      removeGift(id) {
        set((state) => ({ gifts: removeById(state.gifts, id) }));
      },

      /** To write -> drafted -> thanked -> to write. */
      cycleThankYou(id) {
        const existing = get().gifts.byId[id];
        if (!existing) return null;
        return get().updateGift(id, { thankYouStatus: nextThankYouStatus(existing.thankYouStatus) });
      },

      setThankYou(id, status) {
        return get().updateGift(id, { thankYouStatus: status });
      },

      /** Bring over gifts logged in the Labs tracker. Returns how many came across. */
      importLabs({ weddingId, gifts = [] }) {
        const created = gifts
          .filter((gift) => gift && typeof gift.fromName === 'string' && gift.fromName.trim())
          .slice(0, GIFT_LIMITS.perWedding)
          .map((gift) => {
            const made = createGift({
              weddingId,
              fromName: gift.fromName,
              guestId: gift.guestId ?? null,
              kind: gift.kind,
              description: gift.description ?? '',
              value: Number.isFinite(gift.value) ? gift.value : 0,
              receivedOn: gift.receivedOn ?? null,
              thankYouStatus: Object.values(ThankYouStatus).includes(gift.thankYouStatus)
                ? gift.thankYouStatus
                : ThankYouStatus.TODO,
            });
            return { ...made, ...withThankedOn(made, made.thankYouStatus) };
          });
        if (created.length) set((state) => ({ gifts: upsertMany(state.gifts, created) }));
        set({ labsImportedAt: new Date().toISOString() });
        return created.length;
      },

      reset() {
        set({ ...initialState, gifts: emptyCollection() });
      },
    }),
    {
      name: 'gifts:store',
      storage: zustandStorage,
      version: 1,
      partialize: (state) => ({ gifts: state.gifts, labsImportedAt: state.labsImportedAt }),
    }
  )
);

export const selectGifts = (state) => denormalise(state.gifts);
export const selectGiftById = (id) => (state) => state.gifts.byId[id] ?? null;
