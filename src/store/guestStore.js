import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '../services/storage';
import { analytics, AnalyticsEvents } from '../services/analytics';
import { useEventStore } from './eventStore';
import { useSeatingStore } from './seatingStore';
import {
  createGuest,
  createHousehold,
  touchEntity,
  emptyCollection,
  upsert,
  upsertMany,
  removeById,
  removeManyById,
  denormalise,
  RsvpStatus,
} from '../models';

/**
 * Guests and households.
 *
 * RSVP counts are derived on read by `summariseRsvps` rather than cached, which
 * is what makes PRD s.9's "counts update immediately" free: there is no counter
 * to invalidate, so the dashboard snapshot and the guest list can never
 * disagree.
 *
 * Bulk actions exist as first-class store methods because the alternative -
 * looping `updateGuest` from a screen - would write state N times and re-render
 * the list on each one.
 */

const initialState = {
  guests: emptyCollection(),
  households: emptyCollection(),
};

export const useGuestStore = create()(
  persist(
    (set, get) => ({
      ...initialState,

      // --- Guests -----------------------------------------------------------
      addGuest(input) {
        const guest = createGuest(input);
        set((state) => ({ guests: upsert(state.guests, guest) }));
        analytics.track(AnalyticsEvents.GUEST_ADDED, {
          hasHousehold: Boolean(guest.householdId),
          isChild: guest.isChild,
        });
        return guest;
      },

      addGuests(inputs = []) {
        const guests = inputs.map(createGuest);
        if (!guests.length) return [];
        set((state) => ({ guests: upsertMany(state.guests, guests) }));
        analytics.track(AnalyticsEvents.GUESTS_IMPORTED, { count: guests.length });
        return guests;
      },

      updateGuest(id, patch) {
        const existing = get().guests.byId[id];
        if (!existing) return null;
        const updated = touchEntity(existing, patch);
        set((state) => ({ guests: upsert(state.guests, updated) }));
        analytics.track(AnalyticsEvents.GUEST_UPDATED, { guestId: id });
        return updated;
      },

      /**
       * Change an RSVP. Stamps the response date on any real answer so the
       * couple can see when someone replied, and clears it if the status goes
       * back to pending.
       */
      setRsvp(id, rsvpStatus) {
        const existing = get().guests.byId[id];
        if (!existing) return null;

        const isAnswer = rsvpStatus !== RsvpStatus.PENDING && rsvpStatus !== RsvpStatus.NO_RESPONSE;
        const updated = touchEntity(existing, {
          rsvpStatus,
          rsvpRespondedAt: isAnswer ? new Date().toISOString() : null,
        });

        set((state) => ({ guests: upsert(state.guests, updated) }));
        analytics.track(AnalyticsEvents.RSVP_UPDATED, { guestId: id, rsvpStatus });
        return updated;
      },

      deleteGuest(id) {
        set((state) => ({ guests: removeById(state.guests, id) }));
        useEventStore.getState().forgetGuests([id]);
        useSeatingStore.getState().forgetGuests([id]);
        analytics.track(AnalyticsEvents.GUEST_DELETED, { guestId: id });
      },

      // --- Bulk actions -----------------------------------------------------
      /** Apply one patch to many guests in a single state write. */
      bulkUpdate(ids = [], patch) {
        const { guests } = get();
        const updated = ids
          .map((id) => guests.byId[id])
          .filter(Boolean)
          .map((guest) => touchEntity(guest, patch));

        if (!updated.length) return [];
        set((state) => ({ guests: upsertMany(state.guests, updated) }));
        return updated;
      },

      bulkDelete(ids = []) {
        set((state) => ({ guests: removeManyById(state.guests, ids) }));
        useEventStore.getState().forgetGuests(ids);
        useSeatingStore.getState().forgetGuests(ids);
      },

      // --- Households -------------------------------------------------------
      addHousehold(input) {
        const household = createHousehold(input);
        set((state) => ({ households: upsert(state.households, household) }));
        analytics.track(AnalyticsEvents.HOUSEHOLD_CREATED, {});
        return household;
      },

      updateHousehold(id, patch) {
        const existing = get().households.byId[id];
        if (!existing) return null;
        const updated = touchEntity(existing, patch);
        set((state) => ({ households: upsert(state.households, updated) }));
        return updated;
      },

      /** Removing a household must not remove its people - unlink them instead. */
      deleteHousehold(id) {
        const orphans = denormalise(get().guests)
          .filter((guest) => guest.householdId === id)
          .map((guest) => touchEntity(guest, { householdId: null }));

        set((state) => ({
          households: removeById(state.households, id),
          guests: orphans.length ? upsertMany(state.guests, orphans) : state.guests,
        }));
      },

      reset() {
        set({ ...initialState, guests: emptyCollection(), households: emptyCollection() });
      },
    }),
    {
      name: 'guests:store',
      storage: zustandStorage,
      version: 1,
      partialize: (state) => ({ guests: state.guests, households: state.households }),
    }
  )
);

// --- Selectors ---------------------------------------------------------------

export const selectAllGuests = (state) => denormalise(state.guests);
export const selectAllHouseholds = (state) => denormalise(state.households);
export const selectGuestById = (id) => (state) => state.guests.byId[id] ?? null;
export const selectGuestCount = (state) => state.guests.allIds.length;
export const selectHasGuests = (state) => state.guests.allIds.length > 0;
