import { LOCAL_WORKSPACE } from '../storage/workspaceStorage';

/**
 * Connecting this phone's wedding to an account (design M1 §4, decisions D2
 * and D6).
 *
 *  - Upload: the account has no wedding yet. Everything on the phone is copied
 *    into a new workspace (every store, so onboarding progress and today's
 *    checklist come too), then every synced record is queued for upload.
 *  - Open: the account already has a wedding. The phone switches to it and
 *    pulls; the phone's own local wedding is left exactly as it was. Two
 *    weddings are never merged.
 *  - Leave (sign-out, removed from the wedding): the synced copy is deleted
 *    from the phone and the local wedding comes back.
 *  - Invites (A5): the owner makes a link; the partner joins with it, which
 *    is the same as opening the account's wedding. A partner can also leave
 *    the shared wedding for good.
 *
 * Every switch runs with sync tracking paused, so emptying the stores is never
 * mistaken for deleting the wedding.
 */
export function createWorkspaceLink({ client, engine, workspaceStorage, syncStore, getToken }) {
  const isLinked = () => workspaceStorage.getActive() !== LOCAL_WORKSPACE;

  /** Copy every registered store's data, except sync bookkeeping, into `workspaceId`. */
  async function copyInto(workspaceId) {
    const stores = workspaceStorage.registeredStores().filter((store) => store !== syncStore);
    const snapshots = stores.map((store) => [store, store.getState()]);
    await workspaceStorage.switchTo(workspaceId);
    for (const [store, state] of snapshots) store.setState(state);
  }

  return {
    isLinked,

    async listAccountWorkspaces() {
      return client.listWorkspaces(getToken());
    },

    /** D2, no wedding on the account: upload this phone's. Resolves `{ workspace, queued }`. */
    async uploadThisWedding(name) {
      const workspace = await client.createWorkspace(getToken(), name);
      await engine.whilePaused(() => copyInto(workspace.id));
      const queued = engine.seedAll();
      await engine.syncNow();
      return { workspace, queued };
    },

    /** D2, a wedding on the account: switch to it and pull it. */
    async openAccountWorkspace(workspace) {
      await engine.whilePaused(() => workspaceStorage.switchTo(workspace.id));
      return engine.syncNow();
    },

    /**
     * D6: back to the local wedding, deleting the synced copy from this
     * phone. Changes not yet uploaded are lost - callers warn first, using
     * `pendingChanges`.
     */
    async leave({ reason = null } = {}) {
      const workspaceId = workspaceStorage.getActive();
      if (workspaceId === LOCAL_WORKSPACE) return false;
      await engine.whilePaused(async () => {
        await workspaceStorage.switchTo(LOCAL_WORKSPACE);
        await workspaceStorage.clear(workspaceId);
      });
      if (reason) syncStore.getState().setResult({ error: reason });
      return true;
    },

    pendingChanges() {
      return isLinked() ? syncStore.getState().outbox.length : 0;
    },

    /** `{ url, expiresAt }` for the partner. Only the owner can make one. */
    async createInviteLink() {
      return client.createInvite(getToken(), workspaceStorage.getActive());
    },

    /** Join with an invite token and open that wedding. Resolves the workspace. */
    async joinWithInvite(inviteToken) {
      const { workspace } = await client.acceptInvite(getToken(), inviteToken);
      if (workspaceStorage.getActive() !== workspace.id) await this.openAccountWorkspace(workspace);
      return workspace;
    },

    async listMembers() {
      return client.listMembers(getToken(), workspaceStorage.getActive());
    },

    /** Owner only: the partner loses access on their next sync. */
    async removePartner(userId) {
      await client.removeMember(getToken(), workspaceStorage.getActive(), userId);
    },

    /** A partner leaves the shared wedding for good, then this phone goes back to its own. */
    async leaveShared(myUserId) {
      await client.removeMember(getToken(), workspaceStorage.getActive(), myUserId);
      return this.leave();
    },
  };
}
