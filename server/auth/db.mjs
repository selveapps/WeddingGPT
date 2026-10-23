import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import { createInviteRepository } from './invites.mjs';
import { createSyncRepository } from './sync.mjs';
import { createWorkspaceRepository } from './workspaces.mjs';

/**
 * Account storage, on SQLite through Node's built-in `node:sqlite`.
 *
 * Two tables:
 *   users     one row per account; the password column holds a scrypt hash
 *   sessions  one row per signed-in device
 *
 * Session tokens are stored as SHA-256 hashes, not as the tokens themselves.
 * A copy of this file is then not a set of working logins: the token the app
 * holds cannot be recovered from what is saved here.
 */

const SCHEMA = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name          TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash    TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at    TEXT NOT NULL,
    expires_at    TEXT NOT NULL,
    last_used_at  TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS sessions_expires_at ON sessions(expires_at);
`;

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

/** The user fields that are safe to send to the app. Never the password hash. */
export function publicUser(row) {
  return row ? { id: row.id, email: row.email, name: row.name, createdAt: row.created_at } : null;
}

/**
 * Open (or create) the database.
 * @param path  file path, or ':memory:' for tests
 */
export function openDatabase(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);

  const statements = {
    insertUser: db.prepare(
      `INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ),
    userByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
    userById: db.prepare('SELECT * FROM users WHERE id = ?'),
    insertSession: db.prepare(
      `INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_used_at)
       VALUES (?, ?, ?, ?, ?)`
    ),
    sessionUser: db.prepare(
      `SELECT users.*, sessions.expires_at AS session_expires_at
       FROM sessions JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ? AND sessions.expires_at > ?`
    ),
    touchSession: db.prepare('UPDATE sessions SET last_used_at = ? WHERE token_hash = ?'),
    deleteSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
    deleteExpired: db.prepare('DELETE FROM sessions WHERE expires_at <= ?'),
  };

  const workspaces = createWorkspaceRepository(db);

  return {
    /** Workspaces and memberships - see workspaces.mjs. */
    workspaces,

    /** Partner invites - see invites.mjs. */
    invites: createInviteRepository(db, workspaces),

    /** Push, pull and tombstones - see sync.mjs. Created after workspaces, whose tables it references. */
    sync: createSyncRepository(db),

    /** Returns the new user, or null if the email is already registered. */
    createUser({ email, name, passwordHash }) {
      const now = new Date().toISOString();
      const id = `user_${randomUUID()}`;
      try {
        statements.insertUser.run(id, email, name, passwordHash, now, now);
      } catch (error) {
        if (String(error?.message).includes('UNIQUE')) return null;
        throw error;
      }
      return statements.userById.get(id);
    },

    findUserByEmail(email) {
      return statements.userByEmail.get(email) ?? null;
    },

    /** Start a session and return the raw token. Only its hash is stored. */
    createSession(userId, ttlMs) {
      const token = randomBytes(32).toString('base64url');
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlMs).toISOString();
      statements.insertSession.run(hashToken(token), userId, now.toISOString(), expiresAt, now.toISOString());
      return { token, expiresAt };
    },

    /** The user behind a live session token, or null. */
    userForToken(token) {
      if (!token) return null;
      const tokenHash = hashToken(token);
      const now = new Date().toISOString();
      const row = statements.sessionUser.get(tokenHash, now);
      if (!row) return null;
      statements.touchSession.run(now, tokenHash);
      return row;
    },

    deleteSession(token) {
      if (token) statements.deleteSession.run(hashToken(token));
    },

    pruneExpiredSessions() {
      return statements.deleteExpired.run(new Date().toISOString()).changes;
    },

    close() {
      db.close();
    },
  };
}
