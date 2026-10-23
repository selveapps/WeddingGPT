import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '../services/storage';
import { emptyCollection, denormalise } from '../models';

/**
 * RSVP replies from the guest site, and the invitation links this phone made
 * (slice E1b).
 *
 *  responses  synced down from the server (`rsvpResponses`, read-only: only
 *             a guest's own link can write one)
 *  applied    `{ responseId: submittedAt }` - which submissions this phone has
 *             already copied into the guest list, so each is applied once and
 *             a couple's later edits are not overwritten
 *  links      `{ inviteId: { url, code, targetType, targetId, createdAt } }`.
 *             The server hands out a link once and keeps only its hash, so the
 *             phone that made a link is the one that can share it again.
 *             Kept on this phone only; never synced.
 */

const initialState = {
  responses: emptyCollection(),
  applied: {},
  links: {},
};

export const useRsvpStore = create()(
  persist(
    (set, get) => ({
      ...initialState,

      markApplied(entries = []) {
        if (!entries.length) return;
        const applied = { ...get().applied };
        for (const { id, submittedAt } of entries) applied[id] = submittedAt;
        set({ applied });
      },

      saveLinks(invites = []) {
        if (!invites.length) return;
        const links = { ...get().links };
        for (const invite of invites) {
          links[invite.inviteId] = {
            url: invite.url,
            code: invite.code,
            targetType: invite.targetType,
            targetId: invite.targetId,
            createdAt: new Date().toISOString(),
          };
        }
        set({ links });
      },

      forgetLink(inviteId) {
        const links = { ...get().links };
        delete links[inviteId];
        set({ links });
      },

      reset() {
        set({ ...initialState, responses: emptyCollection() });
      },
    }),
    {
      name: 'rsvp:store',
      storage: zustandStorage,
      version: 1,
      partialize: (state) => ({ responses: state.responses, applied: state.applied, links: state.links }),
    }
  )
);

export const selectRsvpResponses = (state) => denormalise(state.responses);
export const selectRsvpLinks = (state) => state.links;
