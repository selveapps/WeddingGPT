import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { Role } from './workspaces.mjs';

/**
 * Partner invites (design M1 §5, slice A5; threat T4).
 *
 * An invite is a link with a 256-bit random token. Only its SHA-256 hash is
 * stored, so a copy of the database holds no working invites. A token works
 * once, for 7 days, until it is revoked, and only for a signed-in account.
 * Creating a new invite revokes the open one, so a workspace never has more
 * than one live link.
 *
 * A wedding is two people for now: the owner and one partner. Planners and
 * other roles belong to a later slice (design §1, out of scope).
 */

export const INVITE_LIMITS = {
  ttlDays: 7,
  maxMembers: 2,
};

export const INVITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS invites (
    id            TEXT PRIMARY KEY,
    token_hash    TEXT NOT NULL UNIQUE,
    workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_by    TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('partner')),
    created_at    TEXT NOT NULL,
    expires_at    TEXT NOT NULL,
    accepted_by   TEXT,
    accepted_at   TEXT,
    revoked_at    TEXT
  );
  CREATE INDEX IF NOT EXISTS invites_workspace ON invites(workspace_id);
`;

const hashToken = (token) => createHash('sha256').update(String(token)).digest('hex');

/** Outcomes of accepting, so the HTTP layer can answer precisely. */
export const AcceptResult = {
  JOINED: 'joined',
  ALREADY_MEMBER: 'already_member',
  INVALID: 'invalid',
  FULL: 'full',
};

export function createInviteRepository(db, workspaces) {
  db.exec(INVITE_SCHEMA);

  const statements = {
    insert: db.prepare(
      `INSERT INTO invites (id, token_hash, workspace_id, created_by, role, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ),
    revokeOpen: db.prepare(
      `UPDATE invites SET revoked_at = ?
       WHERE workspace_id = ? AND accepted_at IS NULL AND revoked_at IS NULL`
    ),
    findUsable: db.prepare(
      `SELECT * FROM invites
       WHERE token_hash = ? AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > ?`
    ),
    markAccepted: db.prepare('UPDATE invites SET accepted_by = ?, accepted_at = ? WHERE id = ?'),
    memberCount: db.prepare('SELECT COUNT(*) AS n FROM memberships WHERE workspace_id = ?'),
  };

  return {
    /** A new invite for `workspaceId`, revoking any open one. Returns `{ token, expiresAt }`. */
    create(workspaceId, createdBy, { now = new Date() } = {}) {
      const token = randomBytes(32).toString('base64url');
      const expiresAt = new Date(now.getTime() + INVITE_LIMITS.ttlDays * 24 * 60 * 60 * 1000).toISOString();
      db.exec('BEGIN IMMEDIATE');
      try {
        statements.revokeOpen.run(now.toISOString(), workspaceId);
        statements.insert.run(
          `inv_${randomUUID()}`,
          hashToken(token),
          workspaceId,
          createdBy,
          Role.PARTNER,
          now.toISOString(),
          expiresAt
        );
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      return { token, expiresAt };
    },

    revokeOpen(workspaceId, { now = new Date() } = {}) {
      return statements.revokeOpen.run(now.toISOString(), workspaceId).changes;
    },

    /**
     * Use an invite. Someone already in the workspace (the owner tapping their
     * own link) gets the workspace back without using the invite up.
     * Returns `{ result, workspace }`.
     */
    accept(token, userId, { now = new Date() } = {}) {
      if (typeof token !== 'string' || token.length < 20 || token.length > 100) {
        return { result: AcceptResult.INVALID, workspace: null };
      }
      db.exec('BEGIN IMMEDIATE');
      try {
        const invite = statements.findUsable.get(hashToken(token), now.toISOString());
        if (!invite) {
          db.exec('COMMIT');
          return { result: AcceptResult.INVALID, workspace: null };
        }

        const existing = workspaces.membership(invite.workspace_id, userId);
        if (existing) {
          db.exec('COMMIT');
          return { result: AcceptResult.ALREADY_MEMBER, workspace: existing };
        }

        if (statements.memberCount.get(invite.workspace_id).n >= INVITE_LIMITS.maxMembers) {
          db.exec('COMMIT');
          return { result: AcceptResult.FULL, workspace: null };
        }

        workspaces.addMember(invite.workspace_id, userId, invite.role);
        statements.markAccepted.run(userId, now.toISOString(), invite.id);
        db.exec('COMMIT');
        return { result: AcceptResult.JOINED, workspace: workspaces.membership(invite.workspace_id, userId) };
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
