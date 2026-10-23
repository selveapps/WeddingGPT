import { randomUUID } from 'node:crypto';

/**
 * Workspaces and memberships (design M1, slice A1).
 *
 * A workspace is one wedding. A user sees a workspace only through a
 * membership row, and every query here takes the workspace id *and* the user
 * id, so nothing can be read or changed by knowing an id alone (threats T1-T3).
 *
 * Roles: `owner` (created it; can remove the partner) and `partner` (can
 * leave). Invites, which add partners, arrive in slice A5.
 */

export const Role = {
  OWNER: 'owner',
  PARTNER: 'partner',
};

export const WORKSPACE_LIMITS = {
  nameChars: 80,
  perUser: 10,
};

export const WORKSPACE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS workspaces (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    created_by  TEXT NOT NULL REFERENCES users(id),
    created_at  TEXT NOT NULL,
    deleted_at  TEXT
  );

  CREATE TABLE IF NOT EXISTS memberships (
    workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role          TEXT NOT NULL CHECK (role IN ('owner', 'partner')),
    created_at    TEXT NOT NULL,
    PRIMARY KEY (workspace_id, user_id)
  );

  CREATE INDEX IF NOT EXISTS memberships_user_id ON memberships(user_id);
`;

/** Returns `{ field: code }` for a bad workspace name, or null. */
export function validateWorkspaceName(name) {
  const clean = typeof name === 'string' ? name.trim() : '';
  if (!clean) return { name: 'required' };
  if (clean.length > WORKSPACE_LIMITS.nameChars) return { name: 'too_long' };
  return null;
}

const toWorkspace = (row) =>
  row ? { id: row.id, name: row.name, role: row.role, createdAt: row.created_at } : null;

export function createWorkspaceRepository(db) {
  db.exec(WORKSPACE_SCHEMA);

  const statements = {
    insertWorkspace: db.prepare(
      'INSERT INTO workspaces (id, name, created_by, created_at) VALUES (?, ?, ?, ?)'
    ),
    insertMembership: db.prepare(
      'INSERT INTO memberships (workspace_id, user_id, role, created_at) VALUES (?, ?, ?, ?)'
    ),
    forUser: db.prepare(
      `SELECT workspaces.*, memberships.role FROM memberships
       JOIN workspaces ON workspaces.id = memberships.workspace_id
       WHERE memberships.user_id = ? AND workspaces.deleted_at IS NULL
       ORDER BY workspaces.created_at, workspaces.id`
    ),
    countForUser: db.prepare(
      `SELECT COUNT(*) AS n FROM memberships
       JOIN workspaces ON workspaces.id = memberships.workspace_id
       WHERE memberships.user_id = ? AND workspaces.deleted_at IS NULL`
    ),
    membership: db.prepare(
      `SELECT workspaces.*, memberships.role FROM memberships
       JOIN workspaces ON workspaces.id = memberships.workspace_id
       WHERE memberships.workspace_id = ? AND memberships.user_id = ? AND workspaces.deleted_at IS NULL`
    ),
    members: db.prepare(
      `SELECT users.id AS user_id, users.name, memberships.role, memberships.created_at
       FROM memberships JOIN users ON users.id = memberships.user_id
       WHERE memberships.workspace_id = ?
       ORDER BY CASE memberships.role WHEN 'owner' THEN 0 ELSE 1 END, memberships.created_at`
    ),
    deleteMembership: db.prepare('DELETE FROM memberships WHERE workspace_id = ? AND user_id = ?'),
  };

  return {
    /** The workspaces this user belongs to, oldest first. */
    listForUser(userId) {
      return statements.forUser.all(userId).map(toWorkspace);
    },

    countForUser(userId) {
      return statements.countForUser.get(userId).n;
    },

    /** Create a workspace with the user as its owner, in one transaction. */
    create(userId, name) {
      const id = `ws_${randomUUID()}`;
      const now = new Date().toISOString();
      db.exec('BEGIN');
      try {
        statements.insertWorkspace.run(id, name.trim(), userId, now);
        statements.insertMembership.run(id, userId, Role.OWNER, now);
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      return toWorkspace(statements.membership.get(id, userId));
    },

    /** The workspace as this user sees it (with their role), or null if they are not a member. */
    membership(workspaceId, userId) {
      return toWorkspace(statements.membership.get(workspaceId, userId));
    },

    /** Used by invites (A5) and tests; not exposed as a route on its own. */
    addMember(workspaceId, userId, role = Role.PARTNER) {
      statements.insertMembership.run(workspaceId, userId, role, new Date().toISOString());
    },

    members(workspaceId) {
      return statements.members
        .all(workspaceId)
        .map((row) => ({ userId: row.user_id, name: row.name, role: row.role, joinedAt: row.created_at }));
    },

    removeMember(workspaceId, userId) {
      return statements.deleteMembership.run(workspaceId, userId).changes > 0;
    },
  };
}

/**
 * Who may remove whom. The owner removes a partner; a partner may leave. The
 * owner cannot leave their own workspace here - handing it over is part of
 * account deletion (decision D4, slice A7).
 */
export function canRemoveMember({ actorRole, actorId, targetRole, targetId }) {
  if (actorId === targetId) return actorRole === Role.PARTNER;
  return actorRole === Role.OWNER && targetRole === Role.PARTNER;
}
