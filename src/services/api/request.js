/**
 * The one fetch wrapper for the WeddingGPT API server (`server/auth`).
 *
 * Every call resolves with the parsed JSON (or null for 204), or throws an
 * `ApiError` whose `code` is the server's error code, or `offline` / `timeout`
 * when the request never got an answer. Feature clients (auth, sync) turn those
 * into their own errors and copy.
 */

const DEFAULT_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  constructor(code, { status = 0, body = null } = {}) {
    super(code);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.body = body;
  }
}

export const NetworkErrorCode = {
  OFFLINE: 'offline',
  TIMEOUT: 'timeout',
  BAD_RESPONSE: 'bad_response',
};

/** `request(path, { method, body, token, query })` bound to one server. */
export function createApiRequest({ url, appToken, timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = fetch }) {
  const base = url.replace(/\/+$/, '');

  return async function request(path, { method = 'GET', body, token, query } = {}) {
    const search = query
      ? `?${Object.entries(query)
          .filter(([, value]) => value !== undefined && value !== null)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&')}`
      : '';

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
      response = await fetchImpl(`${base}${path}${search}`, {
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
      throw new ApiError(error?.name === 'AbortError' ? NetworkErrorCode.TIMEOUT : NetworkErrorCode.OFFLINE);
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 204) return null;
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(json?.error ?? `http_${response.status}`, { status: response.status, body: json });
    }
    if (!json) throw new ApiError(NetworkErrorCode.BAD_RESPONSE, { status: response.status });
    return json;
  };
}
