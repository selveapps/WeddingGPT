import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useStoreHydration } from '@/store';
import { useAuthStore, selectAuthStatus, AuthStatus } from '@/store/authStore';
import { isSyncConfigured, syncEngine, workspaceLink } from '@/services/sync';

const INTERVAL_MS = 5 * 60 * 1000;

/**
 * Runs sync for the whole app. Mounted once, in the root layout.
 *
 *  - Starts watching the stores only after they have hydrated, so the
 *    wedding read from disk is never mistaken for new edits.
 *  - Syncs on sign-in, every five minutes, and when the app comes back to
 *    the foreground. Local edits also sync two seconds after they happen.
 *  - Whenever the person ends up signed out - the Sign out button, a revoked
 *    session, an expired one - the synced copy leaves the phone (D6). Doing it
 *    here covers every route to signed out in one place.
 */
export function useSyncLifecycle() {
  const hydrated = useStoreHydration();
  const status = useAuthStore(selectAuthStatus);
  const enabled = isSyncConfigured && hydrated;

  useEffect(() => {
    if (!enabled) return undefined;
    syncEngine.attach();
    return () => syncEngine.detach();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (status === AuthStatus.SIGNED_OUT && workspaceLink.isLinked()) workspaceLink.leave();
    if (status === AuthStatus.SIGNED_IN) syncEngine.syncNow();
  }, [enabled, status]);

  useEffect(() => {
    if (!enabled) return undefined;
    const interval = setInterval(() => syncEngine.syncNow(), INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') syncEngine.syncNow();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [enabled]);
}

export default useSyncLifecycle;
