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
  FORBIDDEN: 'forbidden',
  /** An invite link that was used, revoked, expired or never existed. */
  INVITE_INVALID: 'invite_invalid',
  WORKSPACE_FULL: 'workspace_full',
  /** Another wedding already uses that RSVP page address. */
  SLUG_TAKEN: 'slug_taken',
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
  if (error.status === 403) return new SyncError(SyncErrorCode.FORBIDDEN);
  if (error.status === 409 && error.code === 'slug_taken') return new SyncError(SyncErrorCode.SLUG_TAKEN);
  if (error.status === 409 && error.code === 'workspace_full')
    return new SyncError(SyncErrorCode.WORKSPACE_FULL);
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

    async listMembers(token, workspaceId) {
      const json = await request(workspacePath(workspaceId, '/members'), { token });
      return Array.isArray(json?.members) ? json.members : [];
    },

    /** The owner removes the partner, or a partner removes themselves (leaves). */
    async removeMember(token, workspaceId, userId) {
      await request(workspacePath(workspaceId, `/members/${encodeURIComponent(userId)}`), {
        method: 'DELETE',
        token,
      });
    },

    /** `{ token, url, expiresAt }`. Owner only. */
    async createInvite(token, workspaceId) {
      const json = await request(workspacePath(workspaceId, '/invites'), { method: 'POST', token });
      if (!json?.url) throw new SyncError(SyncErrorCode.UNAVAILABLE);
      return json;
    },

    async revokeInvites(token, workspaceId) {
      await request(workspacePath(workspaceId, '/invites'), { method: 'DELETE', token });
    },

    /** `{ workspace, alreadyMember }`, or INVITE_INVALID / WORKSPACE_FULL. */
    async acceptInvite(token, inviteToken) {
      try {
        const json = await request('/v1/invites/accept', {
          method: 'POST',
          token,
          body: { token: inviteToken },
        });
        if (!json?.workspace?.id) throw new SyncError(SyncErrorCode.UNAVAILABLE);
        return { workspace: json.workspace, alreadyMember: Boolean(json.alreadyMember) };
      } catch (error) {
        // Here a 404 means the invite, not a workspace we lost.
        if (error?.code === SyncErrorCode.GONE) throw new SyncError(SyncErrorCode.INVITE_INVALID);
        throw error;
      }
    },

    // --- RSVP site (slice E1a) ------------------------------------------------

    async getRsvpSettings(token, workspaceId) {
      return (await request(workspacePath(workspaceId, '/rsvp/settings'), { token }))?.settings ?? null;
    },

    /** `{ slug, deadline, questions }`; fields left out keep their value. */
    async saveRsvpSettings(token, workspaceId, patch) {
      const json = await request(workspacePath(workspaceId, '/rsvp/settings'), {
        method: 'PUT',
        token,
        body: patch,
      });
      return json?.settings ?? null;
    },

    async listRsvpInvites(token, workspaceId) {
      return (await request(workspacePath(workspaceId, '/rsvp/invites'), { token }))?.invites ?? [];
    },

    /** `[{ inviteId, targetType, targetId, url, code, expiresAt }]` - links and codes are only ever returned here. */
    async createRsvpInvites(token, workspaceId, targets) {
      const json = await request(workspacePath(workspaceId, '/rsvp/invites'), {
        method: 'POST',
        token,
        body: { targets },
      });
      return json?.invites ?? [];
    },

    async revokeRsvpInvite(token, workspaceId, inviteId) {
      await request(workspacePath(workspaceId, `/rsvp/invites/${encodeURIComponent(inviteId)}/revoke`), {
        method: 'POST',
        token,
      });
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
