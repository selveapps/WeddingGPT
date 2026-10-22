import { AuthError, AuthErrorCode, fieldMessages } from './AuthError';

/**
 * HTTP client for the WeddingGPT account server (`server/auth`).
 *
 * Every method resolves with the server's JSON or throws an `AuthError`, so
 * callers handle one error type whatever went wrong - network, timeout, or a
 * refusal from the server.
 */

const DEFAULT_TIMEOUT_MS = 15000;

function errorForStatus(status, body) {
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

export function createAuthClient({ url, appToken, timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = fetch }) {
  const base = url.replace(/\/+$/, '');

  async function request(path, { method = 'GET', body, token } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
      response = await fetchImpl(`${base}${path}`, {
        method,
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(appToken ? { 'X-App-Token': appToken } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (error) {
      throw new AuthError(error?.name === 'AbortError' ? AuthErrorCode.TIMEOUT : AuthErrorCode.OFFLINE);
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 204) return null;
    const json = await response.json().catch(() => null);
    if (!response.ok) throw errorForStatus(response.status, json);
    if (!json) throw new AuthError(AuthErrorCode.UNAVAILABLE);
    return json;
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
  };
}

export default createAuthClient;
