import { ApiError, NetworkErrorCode, createApiRequest } from '../api/request';
import { AuthError, AuthErrorCode, fieldMessages } from './AuthError';

/**
 * HTTP client for the WeddingGPT account server (`server/auth`).
 *
 * Every method resolves with the server's JSON or throws an `AuthError`, so
 * callers handle one error type whatever went wrong - network, timeout, or a
 * refusal from the server.
 */

/** Turn the shared API error into the auth error screens know how to show. */
function toAuthError(error) {
  if (!(error instanceof ApiError)) return error;
  if (error.code === NetworkErrorCode.OFFLINE) return new AuthError(AuthErrorCode.OFFLINE);
  if (error.code === NetworkErrorCode.TIMEOUT) return new AuthError(AuthErrorCode.TIMEOUT);
  const { status, body } = error;
  if (status === 400) return new AuthError(AuthErrorCode.INVALID, { fields: fieldMessages(body?.fields) });
  if (status === 401) {
    return new AuthError(
      body?.error === 'invalid_credentials' ? AuthErrorCode.INVALID_CREDENTIALS : AuthErrorCode.UNAUTHORISED
    );
  }
  if (status === 409) return new AuthError(AuthErrorCode.EMAIL_TAKEN);
  if (status === 429) return new AuthError(AuthErrorCode.RATE_LIMITED);
  return new AuthError(AuthErrorCode.UNAVAILABLE);
}

export function createAuthClient({ url, appToken, timeoutMs, fetchImpl }) {
  const apiRequest = createApiRequest({ url, appToken, timeoutMs, fetchImpl });

  async function request(path, options) {
    try {
      return await apiRequest(path, options);
    } catch (error) {
      throw toAuthError(error);
    }
  }

  /** `{ user, token, expiresAt }` from register and login. */
  function session(json) {
    if (!json?.user?.id || typeof json.token !== 'string') throw new AuthError(AuthErrorCode.UNAVAILABLE);
    return { user: json.user, token: json.token, expiresAt: json.expiresAt ?? null };
  }

  return {
    async register({ name, email, password }) {
      return session(await request('/v1/auth/register', { method: 'POST', body: { name, email, password } }));
    },

    async login({ email, password }) {
      return session(await request('/v1/auth/login', { method: 'POST', body: { email, password } }));
    },

    async me(token) {
      const json = await request('/v1/auth/me', { token });
      if (!json?.user?.id) throw new AuthError(AuthErrorCode.UNAVAILABLE);
      return json.user;
    },

    async logout(token) {
      await request('/v1/auth/logout', { method: 'POST', token });
    },

    /** Everything the server holds for this account (slice A7). */
    async exportAccount(token) {
      const json = await request('/v1/account/export', { token });
      if (!json?.user?.id || !Array.isArray(json.workspaces)) throw new AuthError(AuthErrorCode.UNAVAILABLE);
      return json;
    },

    /** Delete the account for good. Needs the password again. */
    async deleteAccount(token, password) {
      await request('/v1/account', { method: 'DELETE', token, body: { password } });
    },
  };
}

export default createAuthClient;
