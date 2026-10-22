import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Where the signed-in session lives on the device.
 *
 * The token is a working login, so on iOS and Android it goes in the Keychain
 * or Keystore through SecureStore - never AsyncStorage, which is a plain file.
 * The web build has no secure store; it falls back to browser storage, which is
 * what every web app does with a session.
 *
 * The user profile is saved next to the token so a returning user shows as
 * signed in straight away, even offline, before the server confirms it.
 */

const KEY = 'auth.session';

const backend =
  Platform.OS === 'web'
    ? {
        get: (key) => AsyncStorage.getItem(key),
        set: (key, value) => AsyncStorage.setItem(key, value),
        remove: (key) => AsyncStorage.removeItem(key),
      }
    : {
        get: (key) => SecureStore.getItemAsync(key),
        set: (key, value) => SecureStore.setItemAsync(key, value),
        remove: (key) => SecureStore.deleteItemAsync(key),
      };

export const savedSession = {
  /** `{ token, user, expiresAt }` or null. A damaged entry reads as signed out. */
  async load() {
    try {
      const raw = await backend.get(KEY);
      const session = raw ? JSON.parse(raw) : null;
      return typeof session?.token === 'string' && session.user?.id ? session : null;
    } catch {
      return null;
    }
  },

  async save({ token, user, expiresAt = null }) {
    await backend.set(KEY, JSON.stringify({ token, user, expiresAt }));
  },

  async clear() {
    try {
      await backend.remove(KEY);
    } catch {
      // Already gone, or the store is unavailable - either way there is no session.
    }
  },
};

export default savedSession;
