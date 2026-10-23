import { useAuthStore, AuthStatus } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { workspaceStorage, LOCAL_WORKSPACE } from '../storage';
import { SYNCED_SLICES } from './collections';
import { SyncErrorCode, createSyncClient } from './syncClient';
import { createSyncEngine } from './syncEngine';
import { createWorkspaceLink } from './workspaceLink';

export { SyncErrorCode, RETRYABLE_SYNC_ERRORS } from './syncClient';

/**
 * The app's sync wiring. Sync talks to the same server as sign-in, so it is
 * available exactly when accounts are (`EXPO_PUBLIC_AUTH_URL`). Without it the
 * engine never has a session and does nothing.
 */
const url = process.env.EXPO_PUBLIC_AUTH_URL;
export const syncClient = url
  ? createSyncClient({ url, appToken: process.env.EXPO_PUBLIC_AUTH_APP_TOKEN })
  : null;
export const isSyncConfigured = Boolean(syncClient);

/** Signed in, and on a synced workspace - otherwise there is nothing to sync. */
function getSession() {
  const { status, token } = useAuthStore.getState();
  const workspaceId = workspaceStorage.getActive();
  if (!syncClient || status !== AuthStatus.SIGNED_IN || !token || workspaceId === LOCAL_WORKSPACE)
    return null;
  return { token, workspaceId };
}

export const syncEngine = createSyncEngine({
  client: syncClient,
  syncStore: useSyncStore,
  slices: SYNCED_SLICES,
  getSession,
  // A rejected session signs the person out; the lifecycle then leaves the workspace (D6).
  onUnauthorised: () => useAuthStore.getState().signOut(),
  // Removed from the wedding, or it was deleted: go back to the local one.
  onGone: () => workspaceLink.leave({ reason: SyncErrorCode.GONE }),
});

export const workspaceLink = createWorkspaceLink({
  client: syncClient,
  engine: syncEngine,
  workspaceStorage,
  syncStore: useSyncStore,
  getToken: () => useAuthStore.getState().token,
});
