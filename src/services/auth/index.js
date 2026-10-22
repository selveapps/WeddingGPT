import { createAuthClient } from './authClient';

export { AuthError, AuthErrorCode, AUTH_ERROR_MESSAGES, fieldMessages } from './AuthError';
export { createAuthClient } from './authClient';
export { savedSession } from './savedSession';

/**
 * The account client the app uses, or null when this build has no account
 * server. Sign-in is optional: without `EXPO_PUBLIC_AUTH_URL` the app works
 * exactly as before and the Account screen says accounts are not available.
 */
const authUrl = process.env.EXPO_PUBLIC_AUTH_URL;

export const authClient = authUrl
  ? createAuthClient({ url: authUrl, appToken: process.env.EXPO_PUBLIC_AUTH_APP_TOKEN })
  : null;

export const isAuthConfigured = Boolean(authClient);
