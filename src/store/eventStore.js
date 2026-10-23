import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '../services/storage';
import {
  EVENT_LIMITS,
  GuestScope,
  createWeddingEvent,
  denormalise,
  emptyCollection,
  removeById,
  sortEvents,
  touchEntity,
  upsert,
  upsertMany,
} from '../models';

/**
 * The wedding's events (workstream C, slice C1). Synced as `events`, so both
 * partners see the same weekend. Deleting an event does not delete its tasks
 * or costs - see `features/events/deleteEvent.js`.
 */

const initialState = { events: emptyCollection() };

export const useEventStore = create()(
  persist(
    (set, get) => ({
      ...initialState,

      addEvent(fields) {
        const existing = denormalise(get().events);
        if (existing.length >= EVENT_LIMITS.perWedding) return null;
        const event = createWeddingEvent({ ...fields, order: existing.length });
        set((state) => ({ events: upsert(state.events, event) }));
        return event;
      },

      updateEvent(id, patch) {
        const existing = get().events.byId[id];
        if (!existing) return null;
        const event = touchEntity(existing, patch);
        set((state) => ({ events: upsert(state.events, event) }));
        return event;
      },

      removeEvent(id) {
        set((state) => ({ events: removeById(state.events, id) }));
      },

      /** Invite exactly these guests (and switch the event to its own list). */
      setInvitedGuests(id, guestIds) {
        return get().updateEvent(id, {
          guestScope: GuestScope.INVITED,
          invitedGuestIds: [...new Set(guestIds)],
        });
      },

      setEveryoneInvited(id) {
        return get().updateEvent(id, { guestScope: GuestScope.EVERYONE });
      },

      /** Swap an event with its neighbour in the sorted list. */
      moveEvent(id, direction) {
        const sorted = sortEvents(denormalise(get().events));
        const index = sorted.findIndex((event) => event.id === id);
        const target = index + direction;
        if (index === -1 || target < 0 || target >= sorted.length) return false;
        const a = sorted[index];
        const b = sorted[target];
        // Only the order breaks ties; same-day, same-time events are the ones that can move.
        if (a.date !== b.date || a.startTime !== b.startTime) return false;
        const orderA = a.order ?? index;
        const orderB = b.order ?? target;
        set((state) => ({
          events: upsertMany(state.events, [
            touchEntity(a, { order: orderB === orderA ? orderA + direction : orderB }),
            touchEntity(b, { order: orderA }),
          ]),
        }));
        return true;
      },

      /**
       * Take deleted guests off every event's list. Called by the guest store
       * when guests are deleted, rather than by comparing lists, so a store
       * that is briefly empty (a workspace switch) never clears invitations.
       */
      forgetGuests(guestIds = []) {
        const gone = new Set(guestIds);
        if (!gone.size) return 0;
        const changed = denormalise(get().events)
          .filter((event) => (event.invitedGuestIds ?? []).some((id) => gone.has(id)))
          .map((event) =>
            touchEntity(event, { invitedGuestIds: event.invitedGuestIds.filter((id) => !gone.has(id)) })
          );
        if (changed.length) set((state) => ({ events: upsertMany(state.events, changed) }));
        return changed.length;
      },

      reset() {
        set({ events: emptyCollection() });
      },
    }),
    {
      name: 'events:store',
      storage: zustandStorage,
      version: 1,
      partialize: (state) => ({ events: state.events }),
    }
  )
);

export const selectEvents = (state) => denormalise(state.events);
export const selectEventById = (id) => (state) => state.events.byId[id] ?? null;
