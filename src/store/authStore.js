import { create } from 'zustand';

import { AuthError, AuthErrorCode, authClient, savedSession } from '../services/auth';
import { analytics, AnalyticsEvents } from '../services/analytics';

/**
 * Who is signed in, if anyone.
 *
 * Sign-in is optional - the wedding workspace stays on the device whether or
 * not there is an account - so this store is deliberately *not* part of the
 * launch hydration gate. It starts as `unknown`, `restore()` reads the saved
 * session in the background, and nothing waits on it.
 *
 * The session is not kept in zustand's persisted storage: the token belongs in
 * the secure store (`savedSession`), not in the AsyncStorage file the other
 * stores write to.
 *
 * status: 'unknown' (not restored yet) | 'signedOut' | 'signedIn'
 */

export const AuthStatus = {
  UNKNOWN: 'unknown',
  SIGNED_OUT: 'signedOut',
  SIGNED_IN: 'signedIn',
};

const signedOut = { status: AuthStatus.SIGNED_OUT, user: null, token: null };

/** Built by a factory so tests can supply a fake client and storage. */
export function createAuthStore({ client, storage, track = () => {} }) {
  return create()((set, get) => ({
    status: AuthStatus.UNKNOWN,
    user: null,
    token: null,
    isAvailable: Boolean(client),

    /**
     * Load the saved session and confirm it with the server. Offline or a
     * server hiccup keeps the saved user; only an explicit "unauthorised"
     * signs the device out.
     */
    async restore() {
      const saved = await storage.load();
      if (!saved) {
        set(signedOut);
        return;
      }

      set({ status: AuthStatus.SIGNED_IN, user: saved.user, token: saved.token });
      if (!client) return;

      try {
        const user = await client.me(saved.token);
        if (get().token !== saved.token) return; // signed out or switched while we waited
        set({ user });
        await storage.save({ ...saved, user });
      } catch (error) {
        if (error?.code === AuthErrorCode.UNAUTHORISED && get().token === saved.token) {
          await storage.clear();
          set(signedOut);
        }
      }
    },

    async signIn({ email, password }) {
      if (!client) throw new AuthError(AuthErrorCode.NOT_CONFIGURED);
      const session = await client.login({ email: email.trim(), password });
      await storage.save(session);
      set({ status: AuthStatus.SIGNED_IN, user: session.user, token: session.token });
      track(AnalyticsEvents.SIGNED_IN);
      return session.user;
    },

    async signUp({ name, email, password }) {
      if (!client) throw new AuthError(AuthErrorCode.NOT_CONFIGURED);
      const session = await client.register({ name: name?.trim() ?? '', email: email.trim(), password });
      await storage.save(session);
      set({ status: AuthStatus.SIGNED_IN, user: session.user, token: session.token });
      track(AnalyticsEvents.SIGNED_UP);
      return session.user;
    },

    /** Always signs the device out, even if the server cannot be reached. */
    async signOut() {
      const { token } = get();
      set(signedOut);
      await storage.clear();
      track(AnalyticsEvents.SIGNED_OUT);
      if (client && token) {
        // Best effort: the session expires on its own if this never arrives.
        client.logout(token).catch(() => {});
      }
    },
  }));
}

export const useAuthStore = createAuthStore({
  client: authClient,
  storage: savedSession,
  track: (event) => analytics.track(event),
});

export const selectAuthStatus = (state) => state.status;
export const selectAuthUser = (state) => state.user;
export const selectIsSignedIn = (state) => state.status === AuthStatus.SIGNED_IN;
export const selectAuthAvailable = (state) => state.isAvailable;
