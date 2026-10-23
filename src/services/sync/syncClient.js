import { ApiError, NetworkErrorCode, createApiRequest } from '../api/request';

/**
 * HTTP client for workspaces and sync (server slices A1 and A2).
 *
 * Errors become a `SyncError` with one of a few codes the sync engine acts on:
 * try again later (offline, timeout, unavailable), sign the person out
 * (unauthorised), or stop syncing this workspace (gone - it was deleted or
 * the person was removed from it).
 */

export const SyncErrorCode = {
  OFFLINE: 'offline',
  TIMEOUT: 'timeout',
  UNAUTHORISED: 'unauthorised',
  GONE: 'gone',
  LIMIT_REACHED: 'limit_reached',
  INVALID: 'invalid',
  UNAVAILABLE: 'unavailable',
};

/** Codes worth retrying on the next sync. */
export const RETRYABLE_SYNC_ERRORS = [
  SyncErrorCode.OFFLINE,
  SyncErrorCode.TIMEOUT,
  SyncErrorCode.UNAVAILABLE,
];

export class SyncError extends Error {
  constructor(code) {
    super(code);
    this.name = 'SyncError';
    this.code = code;
  }
}

function toSyncError(error) {
  if (!(error instanceof ApiError)) return error;
  if (error.code === NetworkErrorCode.OFFLINE) return new SyncError(SyncErrorCode.OFFLINE);
  if (error.code === NetworkErrorCode.TIMEOUT) return new SyncError(SyncErrorCode.TIMEOUT);
  if (error.status === 401) return new SyncError(SyncErrorCode.UNAUTHORISED);
  // The server answers 404 for a workspace the caller is no longer a member of.
  if (error.status === 404) return new SyncError(SyncErrorCode.GONE);
  if (error.status === 403 && error.code === 'limit_reached')
    return new SyncError(SyncErrorCode.LIMIT_REACHED);
  if (error.status === 400 || error.status === 413) return new SyncError(SyncErrorCode.INVALID);
  return new SyncError(SyncErrorCode.UNAVAILABLE);
}

export function createSyncClient({ url, appToken, timeoutMs = 30000, fetchImpl }) {
  const apiRequest = createApiRequest({ url, appToken, timeoutMs, fetchImpl });

  async function request(path, options) {
    try {
      return await apiRequest(path, options);
    } catch (error) {
      throw toSyncError(error);
    }
  }

  const workspacePath = (workspaceId, rest) => `/v1/workspaces/${encodeURIComponent(workspaceId)}${rest}`;

  return {
    async listWorkspaces(token) {
      const json = await request('/v1/workspaces', { token });
      return Array.isArray(json?.workspaces) ? json.workspaces : [];
    },

    async createWorkspace(token, name) {
      const json = await request('/v1/workspaces', { method: 'POST', token, body: { name } });
      if (!json?.workspace?.id) throw new SyncError(SyncErrorCode.UNAVAILABLE);
      return json.workspace;
    },

    /** `{ applied, conflicts, rejected }` for up to 100 mutations. */
    async push(token, workspaceId, mutations) {
      const json = await request(workspacePath(workspaceId, '/sync/push'), {
        method: 'POST',
        token,
        body: { mutations },
      });
      return {
        applied: json?.applied ?? [],
        conflicts: json?.conflicts ?? [],
        rejected: json?.rejected ?? [],
      };
    },

    /** `{ records, cursor, hasMore }` after `since`. */
    async pull(token, workspaceId, { since = 0, limit } = {}) {
      const json = await request(workspacePath(workspaceId, '/sync/pull'), {
        token,
        query: { since, limit },
      });
      return { records: json?.records ?? [], cursor: json?.cursor ?? since, hasMore: Boolean(json?.hasMore) };
    },
  };
}

export default createSyncClient;
