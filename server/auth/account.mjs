/**
 * Account export and deletion (slice A7, threat T13, decision D4).
 *
 * Export: everything the server holds for one person - their account, and
 * every wedding they belong to with its members and live records. It never
 * includes password hashes, session or invite tokens, or the website password.
 *
 * Deletion runs in one transaction:
 *  - a wedding they own with a partner passes to the longest-standing partner;
 *  - a wedding they own alone is deleted, with every record, tombstone,
 *    invite, RSVP link and website setting in it (all cascade);
 *  - in weddings that stay, their id is removed from records, invites and
 *    pull cursors, so nothing points back at them;
 *  - then the account goes, and with it their sessions and memberships.
 *
 * Personal data is then gone from the live database. Backups are outside
 * this code; T13 asks for them to expire within 30 days.
 */

/** What deleted people show up as in records others still hold. */
export const DELETED_USER = 'deleted';

export function createAccountRepository(db) {
  const statements = {
    user: db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?'),
    memberships: db.prepare(
      `SELECT workspaces.id, workspaces.name, workspaces.created_at, memberships.role, memberships.created_at AS joined_at
       FROM memberships JOIN workspaces ON workspaces.id = memberships.workspace_id
       WHERE memberships.user_id = ? AND workspaces.deleted_at IS NULL
       ORDER BY workspaces.created_at, workspaces.id`
    ),
    members: db.prepare(
      `SELECT users.name, memberships.role, memberships.created_at
       FROM memberships JOIN users ON users.id = memberships.user_id
       WHERE memberships.workspace_id = ?
       ORDER BY CASE memberships.role WHEN 'owner' THEN 0 ELSE 1 END, memberships.created_at`
    ),
    liveRecords: db.prepare(
      `SELECT collection, id, data, updated_at FROM records
       WHERE workspace_id = ? AND deleted_at IS NULL ORDER BY collection, id`
    ),
    ownedWorkspaces: db.prepare(`SELECT workspace_id FROM memberships WHERE user_id = ? AND role = 'owner'`),
    nextOwner: db.prepare(
      `SELECT user_id FROM memberships WHERE workspace_id = ? AND user_id != ?
       ORDER BY created_at, user_id LIMIT 1`
    ),
    promote: db.prepare(`UPDATE memberships SET role = 'owner' WHERE workspace_id = ? AND user_id = ?`),
    setCreator: db.prepare('UPDATE workspaces SET created_by = ? WHERE id = ?'),
    deleteWorkspace: db.prepare('DELETE FROM workspaces WHERE id = ?'),
    scrubRecords: db.prepare('UPDATE records SET updated_by = ? WHERE updated_by = ?'),
    scrubInviteCreator: db.prepare('UPDATE invites SET created_by = ? WHERE created_by = ?'),
    scrubInviteAccepter: db.prepare('UPDATE invites SET accepted_by = ? WHERE accepted_by = ?'),
    revokeTheirInvites: db.prepare(
      `UPDATE invites SET revoked_at = ? WHERE created_by = ? AND accepted_at IS NULL AND revoked_at IS NULL`
    ),
    deleteCursors: db.prepare('DELETE FROM sync_cursors WHERE user_id = ?'),
    deleteUser: db.prepare('DELETE FROM users WHERE id = ?'),
  };

  const parse = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  return {
    /** Everything held for this person, or null if there is no such account. */
    exportFor(userId) {
      const user = statements.user.get(userId);
      if (!user) return null;
      return {
        exportedAt: new Date().toISOString(),
        user: { id: user.id, email: user.email, name: user.name, createdAt: user.created_at },
        workspaces: statements.memberships.all(userId).map((row) => ({
          workspace: { id: row.id, name: row.name, createdAt: row.created_at },
          role: row.role,
          joinedAt: row.joined_at,
          members: statements.members
            .all(row.id)
            .map((member) => ({ name: member.name, role: member.role, joinedAt: member.created_at })),
          records: statements.liveRecords.all(row.id).map((record) => ({
            collection: record.collection,
            id: record.id,
            updatedAt: record.updated_at,
            data: parse(record.data),
          })),
        })),
      };
    },

    /**
     * Delete the account. Returns `{ deletedWorkspaces, handedOver }` (ids),
     * or null if there is no such account.
     */
    deleteAccount(userId) {
      if (!statements.user.get(userId)) return null;
      const deletedWorkspaces = [];
      const handedOver = [];
      const now = new Date().toISOString();

      db.exec('BEGIN');
      try {
        for (const { workspace_id: workspaceId } of statements.ownedWorkspaces.all(userId)) {
          const next = statements.nextOwner.get(workspaceId, userId);
          if (next) {
            statements.promote.run(workspaceId, next.user_id);
            statements.setCreator.run(next.user_id, workspaceId);
            handedOver.push(workspaceId);
          } else {
            statements.deleteWorkspace.run(workspaceId);
            deletedWorkspaces.push(workspaceId);
          }
        }
        // Open invites they sent stop working; then their id leaves what stays.
        statements.revokeTheirInvites.run(now, userId);
        statements.scrubRecords.run(DELETED_USER, userId);
        statements.scrubInviteCreator.run(DELETED_USER, userId);
        statements.scrubInviteAccepter.run(DELETED_USER, userId);
        statements.deleteCursors.run(userId);
        statements.deleteUser.run(userId);
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      return { deletedWorkspaces, handedOver };
    },
  };
}
