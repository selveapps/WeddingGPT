import { fileURLToPath } from 'node:url';

import { createAuthServer } from './app.mjs';
import { openDatabase } from './db.mjs';

/**
 * Starts the WeddingGPT account server. See app.mjs for the API.
 *
 * Environment:
 *   AUTH_DB_PATH    SQLite file (default ./data/auth.db). Back this file up.
 *   APP_TOKEN       optional shared token the app sends as X-App-Token
 *   PORT            default 8788
 *   ALLOWED_ORIGIN  CORS origin for the web build (default *)
 *   PUBLIC_BASE_URL where guests open RSVP pages (default http://localhost:PORT)
 *   INVITE_URL_BASE where invite links point; the token is appended
 *                   (default weddinggpt://invite/, the app's own link)
 */

const PORT = Number(process.env.PORT ?? 8788);
const DB_PATH = process.env.AUTH_DB_PATH || fileURLToPath(new URL('./data/auth.db', import.meta.url));
const APP_TOKEN = process.env.APP_TOKEN || null;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const INVITE_URL_BASE = process.env.INVITE_URL_BASE || undefined;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;

const db = openDatabase(DB_PATH);
const server = createAuthServer({
  db,
  appToken: APP_TOKEN,
  allowedOrigin: ALLOWED_ORIGIN,
  inviteUrlBase: INVITE_URL_BASE,
  publicBaseUrl: PUBLIC_BASE_URL,
});

// Expired sessions are already ignored on read, and old tombstones are only
// purged behind every member's cursor; this just keeps the tables small.
const prune = () => {
  const removed = db.pruneExpiredSessions();
  if (removed) console.log(`[auth] pruned ${removed} expired sessions`);
  const { tombstones, mutations } = db.sync.compact();
  if (tombstones || mutations) console.log(`[sync] purged ${tombstones} tombstones, ${mutations} old mutation ids`);
};
prune();
setInterval(prune, 60 * 60 * 1000).unref();

server.listen(PORT, () => {
  console.log(`WeddingGPT auth server on http://localhost:${PORT} (db ${DB_PATH})`);
  if (!APP_TOKEN) console.warn('APP_TOKEN is not set - any client that finds this URL can create accounts.');
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => {
      db.close();
      process.exit(0);
    });
  });
}
