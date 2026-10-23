import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { createAuthServer } from './app.mjs';
import { openDatabase } from './db.mjs';
import { DELETED_USER } from './account.mjs';
import { Op } from './sync.mjs';
import { Role } from './workspaces.mjs';

const quiet = { info() {}, error() {} };
const PASSWORD = 'a good password';

let counter = 0;
const upsert = (id, data, collection = 'guests') => ({
  mutationId: `mut_${++counter}`,
  collection,
  id,
  op: Op.UPSERT,
  baseVersion: 0,
  data,
});

/** Every value in every table, for "nothing about them is left" checks (T13). */
function everyCell(raw) {
  const tables = raw.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
  return tables.flatMap(({ name }) =>
    raw
      .prepare(`SELECT * FROM "${name}"`)
      .all()
      .flatMap((row) => Object.values(row).map((value) => ({ table: name, value: String(value ?? '') })))
  );
}

describe('account export and deletion (A7, T13)', () => {
  let db;
  /** A second connection to the same file, to look at the tables directly. */
  let raw;
  let server;
  let base;
  let ip = 0;
  const path = join(tmpdir(), `weddinggpt-account-${process.pid}-${Date.now()}.db`);

  before(async () => {
    db = openDatabase(path);
    raw = new DatabaseSync(path);
    server = createAuthServer({ db, log: quiet });
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => {
    server.close();
    raw.close();
    db.close();
    for (const suffix of ['', '-wal', '-shm']) rmSync(`${path}${suffix}`, { force: true });
  });

  // A fresh address per request keeps the per-IP rate limit out of most tests.
  const call = (method, path, { token, body, fromIp } = {}) => {
    ip += 1;
    return fetch(`${base}${path}`, {
      method,
      headers: {
        'X-Forwarded-For': fromIp ?? `10.9.${Math.floor(ip / 250)}.${ip % 250}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  async function register(name) {
    const email = `${name.toLowerCase()}-${++counter}@example.com`;
    const response = await call('POST', '/v1/auth/register', { body: { name, email, password: PASSWORD } });
    const json = await response.json();
    return { ...json, email };
  }

  async function weddingFor(owner, name = 'Our wedding') {
    const response = await call('POST', '/v1/workspaces', { token: owner.token, body: { name } });
    return (await response.json()).workspace;
  }

  let priya;
  let sam;
  let shared;
  let solo;
  beforeEach(async () => {
    priya = await register('Priya');
    sam = await register('Sam');
    shared = await weddingFor(priya, 'Priya and Sam');
    solo = await weddingFor(priya, 'A test wedding');
    db.workspaces.addMember(shared.id, sam.user.id, Role.PARTNER);
    db.sync.push(shared.id, priya.user.id, [
      upsert('guest_1', { firstName: 'Meera', email: 'meera@example.com' }),
    ]);
    db.sync.push(shared.id, sam.user.id, [upsert('guest_2', { firstName: 'Ravi' })]);
    db.sync.push(solo.id, priya.user.id, [upsert('guest_9', { firstName: 'Solo guest' })]);
    db.sync.pull(shared.id, priya.user.id, {});
    db.invites.create(shared.id, priya.user.id);
    db.rsvp.saveSettings(solo.id, { slug: `solo-${counter}` });
    db.rsvp.createInvites(solo.id, [{ type: 'household', id: 'hh_1' }]);
    await db.site.saveSettings(solo.id, { visibility: 'password', password: 'garden2027' });
  });

  describe('export', () => {
    it('needs a session', async () => {
      assert.equal((await call('GET', '/v1/account/export')).status, 401);
      assert.equal((await call('GET', '/v1/account/export', { token: 'made-up' })).status, 401);
    });

    it('returns the account and every wedding it belongs to, with records', async () => {
      const response = await call('GET', '/v1/account/export', { token: priya.token });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      const data = await response.json();
      assert.equal(data.user.email, priya.email);
      assert.deepEqual(data.workspaces.map((w) => w.workspace.name).sort(), [
        'A test wedding',
        'Priya and Sam',
      ]);
      const ours = data.workspaces.find((w) => w.workspace.id === shared.id);
      assert.equal(ours.role, Role.OWNER);
      assert.deepEqual(
        ours.members.map((m) => [m.name, m.role]),
        [
          ['Priya', 'owner'],
          ['Sam', 'partner'],
        ]
      );
      assert.deepEqual(ours.records.map((r) => r.data.firstName).sort(), ['Meera', 'Ravi']);
    });

    it('holds nothing secret and nothing from weddings they are not in', async () => {
      const outsider = await register('Jo');
      await weddingFor(outsider, 'Not yours');
      const text = await (await call('GET', '/v1/account/export', { token: sam.token })).text();
      const data = JSON.parse(text);
      assert.deepEqual(
        data.workspaces.map((w) => w.workspace.id),
        [shared.id]
      );
      assert.ok(!text.includes('Not yours'));
      assert.ok(!text.includes('A test wedding'));
      for (const secret of ['password_hash', 'token_hash', 'scrypt', 'garden2027', sam.token, priya.token]) {
        assert.ok(!text.includes(secret), `export contains ${secret}`);
      }
    });
  });

  describe('deletion', () => {
    it('needs a session and the password, and refuses anything else', async () => {
      assert.equal((await call('DELETE', '/v1/account', { body: { password: PASSWORD } })).status, 401);
      assert.equal((await call('DELETE', '/v1/account', { token: priya.token, body: {} })).status, 400);
      // Too long: refused as invalid, or as too large before it is even read.
      const huge = await call('DELETE', '/v1/account', {
        token: priya.token,
        body: { password: 'x'.repeat(10_000) },
      });
      assert.ok([400, 413].includes(huge.status), `got ${huge.status}`);
      const wrong = await call('DELETE', '/v1/account', { token: priya.token, body: { password: 'not it' } });
      assert.equal(wrong.status, 401);
      assert.equal((await wrong.json()).error, 'invalid_credentials');
      // Nothing happened.
      assert.equal((await call('GET', '/v1/auth/me', { token: priya.token })).status, 200);
      assert.ok(db.workspaces.membership(solo.id, priya.user.id));
    });

    it('only ever deletes the caller: another person’s password does nothing', async () => {
      const response = await call('DELETE', '/v1/account', {
        token: sam.token,
        body: { password: 'Priya’s?' },
      });
      assert.equal(response.status, 401);
      assert.equal((await call('GET', '/v1/auth/me', { token: priya.token })).status, 200);
      assert.equal((await call('GET', '/v1/auth/me', { token: sam.token })).status, 200);
    });

    it('hands a shared wedding to the partner and deletes a solo one with everything in it', async () => {
      const response = await call('DELETE', '/v1/account', {
        token: priya.token,
        body: { password: PASSWORD },
      });
      assert.equal(response.status, 204);

      // The partner now owns the shared wedding and still has every record.
      const kept = db.workspaces.membership(shared.id, sam.user.id);
      assert.equal(kept.role, Role.OWNER);
      const pulled = await (
        await call('GET', `/v1/workspaces/${shared.id}/sync/pull`, { token: sam.token })
      ).json();
      assert.deepEqual(pulled.records.map((r) => r.data?.firstName).sort(), ['Meera', 'Ravi']);
      // ...and can invite someone new, which only owners can.
      assert.equal(
        (await call('POST', `/v1/workspaces/${shared.id}/invites`, { token: sam.token })).status,
        201
      );

      // The solo wedding is gone, with its records, RSVP links and website settings.
      assert.equal(db.workspaces.membership(solo.id, priya.user.id), null);
      for (const table of [
        'records',
        'rsvp_settings',
        'rsvp_invites',
        'site_settings',
        'mutations',
        'sync_cursors',
      ]) {
        const left = raw.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE workspace_id = ?`).get(solo.id).n;
        assert.equal(left, 0, `${table} still has rows for the deleted wedding`);
      }
    });

    it('leaves nothing anywhere that points to them (T13)', async () => {
      const { id } = priya.user;
      await call('DELETE', '/v1/account', { token: priya.token, body: { password: PASSWORD } });

      const traces = everyCell(raw).filter(
        ({ value }) => value.includes(id) || value.toLowerCase().includes(priya.email)
      );
      assert.deepEqual(traces, []);
      // Records they wrote that the partner keeps now say "deleted".
      const meera = raw
        .prepare("SELECT updated_by FROM records WHERE workspace_id = ? AND id = 'guest_1'")
        .get(shared.id);
      assert.equal(meera.updated_by, DELETED_USER);
    });

    it('ends every session and frees the email', async () => {
      const otherDevice = await (
        await call('POST', '/v1/auth/login', { body: { email: priya.email, password: PASSWORD } })
      ).json();
      await call('DELETE', '/v1/account', { token: priya.token, body: { password: PASSWORD } });

      assert.equal((await call('GET', '/v1/auth/me', { token: priya.token })).status, 401);
      assert.equal((await call('GET', '/v1/auth/me', { token: otherDevice.token })).status, 401);
      assert.equal((await call('GET', '/v1/account/export', { token: priya.token })).status, 401);
      const login = await call('POST', '/v1/auth/login', {
        body: { email: priya.email, password: PASSWORD },
      });
      assert.equal(login.status, 401);
      const again = await call('POST', '/v1/auth/register', {
        body: { name: 'Priya', email: priya.email, password: PASSWORD },
      });
      assert.equal(again.status, 201);
    });

    it('stops the invites they sent from working', async () => {
      const { token } = db.invites.create(shared.id, priya.user.id);
      await call('DELETE', '/v1/account', { token: priya.token, body: { password: PASSWORD } });
      const jo = await register('Jo');
      const accepted = await call('POST', '/v1/invites/accept', { token: jo.token, body: { token } });
      assert.equal(accepted.status, 404);
    });

    it('a partner leaving deletes only their part', async () => {
      await call('DELETE', '/v1/account', { token: sam.token, body: { password: PASSWORD } });
      const owner = db.workspaces.membership(shared.id, priya.user.id);
      assert.equal(owner.role, Role.OWNER);
      assert.deepEqual(
        db.workspaces.members(shared.id).map((m) => m.name),
        ['Priya']
      );
      const ravi = raw
        .prepare("SELECT updated_by, data FROM records WHERE workspace_id = ? AND id = 'guest_2'")
        .get(shared.id);
      assert.equal(ravi.updated_by, DELETED_USER);
      assert.equal(JSON.parse(ravi.data).firstName, 'Ravi');
    });

    it('is rate limited, so a stolen session cannot guess the password', async () => {
      const statuses = [];
      for (let i = 0; i < 12; i += 1) {
        const response = await call('DELETE', '/v1/account', {
          token: priya.token,
          body: { password: `guess ${i}` },
          fromIp: '10.250.0.1',
        });
        statuses.push(response.status);
      }
      assert.ok(statuses.includes(429), `no 429 in ${statuses.join(',')}`);
      assert.equal((await call('GET', '/v1/auth/me', { token: priya.token })).status, 200);
    });
  });
});
