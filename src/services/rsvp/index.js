import { useAuthStore } from '../../store/authStore';
import { workspaceStorage } from '../storage';
import { syncClient } from '../sync';

/**
 * The couple's side of the public pages - the RSVP site and the wedding
 * website, which share one address - for the active synced workspace.
 * Thin on purpose: the screen keeps state, the server keeps the rules.
 */
export const RSVP_BATCH = 300;

export function createRsvpApi({ client, getToken, getWorkspaceId }) {
  const call = (fn) => fn(getToken(), getWorkspaceId());

  return {
    getSettings: () => call((token, ws) => client.getRsvpSettings(token, ws)),
    saveSettings: (patch) => call((token, ws) => client.saveRsvpSettings(token, ws, patch)),
    listInvites: () => call((token, ws) => client.listRsvpInvites(token, ws)),
    revoke: (inviteId) => call((token, ws) => client.revokeRsvpInvite(token, ws, inviteId)),
    getSiteSettings: () => call((token, ws) => client.getSiteSettings(token, ws)),
    saveSiteSettings: (patch) => call((token, ws) => client.saveSiteSettings(token, ws, patch)),

    /** Create invites in batches the server accepts. */
    async createInvites(targets) {
      const created = [];
      for (let i = 0; i < targets.length; i += RSVP_BATCH) {
        const batch = targets.slice(i, i + RSVP_BATCH);
        created.push(...(await call((token, ws) => client.createRsvpInvites(token, ws, batch))));
      }
      return created;
    },
  };
}

export const rsvpApi = createRsvpApi({
  client: syncClient,
  getToken: () => useAuthStore.getState().token,
  getWorkspaceId: () => workspaceStorage.getActive(),
});
