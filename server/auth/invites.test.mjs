import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { createAuthServer } from './app.mjs';
import { openDatabase } from './db.mjs';
import { AcceptResult, INVITE_LIMITS } from './invites.mjs';
import { Role } from './workspaces.mjs';

const quiet = { info() {}, error() {} };
const DAY = 24 * 60 * 60 * 1000;

function setup() {
  const db = openDatabase(':memory:');
  const user = (name) => db.createUser({ email: `${name}@example.com`, name, passwordHash: 'x' });
  const priya = user('priya');
  const sam = user('sam');
  const jo = user('jo');
  const workspace = db.workspaces.create(priya.id, 'Priya and Sam');
  return { db, priya, sam, jo, workspace };
}

describe('invite repository', () => {
  it('creates a 256-bit token and stores only its hash', () => {
    // A real file, so the stored rows can be read back independently.
    const dir = mkdtempSync(join(tmpdir(), 'wgpt-invites-'));
    const path = join(dir, 'auth.db');
    const db = openDatabase(path);
    const owner = db.createUser({ email: 'o@example.com', name: 'o', passwordHash: 'x' });
    const workspace = db.workspaces.create(owner.id, 'W');
    const { token, expiresAt } = db.invites.create(workspace.id, owner.id);
    db.close();

    assert.ok(Buffer.from(token, 'base64url').length >= 32);
    assert.ok(Date.parse(expiresAt) > Date.now() + (INVITE_LIMITS.ttlDays - 1) * DAY);

    const raw = new DatabaseSync(path);
    const rows = raw.prepare('SELECT * FROM invites').all();
    raw.close();
    rmSync(dir, { recursive: true, force: true });
    assert.equal(rows.length, 1);
    assert.ok(!JSON.stringify(rows).includes(token), 'the raw token is not stored');
    assert.match(rows[0].token_hash, /^[0-9a-f]{64}$/);
  });

  it('T4: an invite works once', () => {
    const { db, priya, sam, jo, workspace } = setup();
    const { token } = db.invites.create(workspace.id, priya.id);
    assert.equal(db.invites.accept(token, sam.id).result, AcceptResult.JOINED);
    assert.equal(db.workspaces.membership(workspace.id, sam.id).role, Role.PARTNER);
    assert.equal(db.invites.accept(token, jo.id).result, AcceptResult.INVALID);
    assert.equal(db.workspaces.membership(workspace.id, jo.id), null);
  });

  it('T4: an invite expires after 7 days', () => {
    const { db, priya, sam, workspace } = setup();
    const now = new Date();
    const { token } = db.invites.create(workspace.id, priya.id, { now });
    const later = new Date(now.getTime() + INVITE_LIMITS.ttlDays * DAY + 1000);
    assert.equal(db.invites.accept(token, sam.id, { now: later }).result, AcceptResult.INVALID);
    assert.equal(db.invites.accept(token, sam.id, { now }).result, AcceptResult.JOINED);
  });

  it('T4: revoking, or creating a new invite, kills the open one', () => {
    const { db, priya, sam, workspace } = setup();
    const first = db.invites.create(workspace.id, priya.id).token;
    const second = db.invites.create(workspace.id, priya.id).token;
    assert.equal(db.invites.accept(first, sam.id).result, AcceptResult.INVALID);

    assert.equal(db.invites.revokeOpen(workspace.id), 1);
    assert.equal(db.invites.accept(second, sam.id).result, AcceptResult.INVALID);
  });

  it('T4: made-up and malformed tokens are invalid', () => {
    const { db, sam } = setup();
    for (const token of ['', 'short', 'x'.repeat(43), 'x'.repeat(500), null, 42]) {
      assert.equal(db.invites.accept(token, sam.id).result, AcceptResult.INVALID);
    }
  });

  it('lets a member tap their own link without using it up', () => {
    const { db, priya, sam, workspace } = setup();
    const { token } = db.invites.create(workspace.id, priya.id);
    const own = db.invites.accept(token, priya.id);
    assert.equal(own.result, AcceptResult.ALREADY_MEMBER);
    assert.equal(own.workspace.role, Role.OWNER);
    assert.equal(db.invites.accept(token, sam.id).result, AcceptResult.JOINED);
  });

  it('keeps a wedding to two people', () => {
    const { db, priya, sam, jo, workspace } = setup();
    db.workspaces.addMember(workspace.id, sam.id, Role.PARTNER);
    const { token } = db.invites.create(workspace.id, priya.id);
    assert.equal(db.invites.accept(token, jo.id).result, AcceptResult.FULL);
    // A full workspace does not use the invite up: it works again if a seat frees.
    db.workspaces.removeMember(workspace.id, sam.id);
    assert.equal(db.invites.accept(token, jo.id).result, AcceptResult.JOINED);
  });
});

describe('invite API', () => {
  let s;
  let server;
  let base;
  const tokens = {};
  let ip = 0;

  before(async () => {
    s = setup();
    for (const name of ['priya', 'sam', 'jo']) tokens[name] = s.db.createSession(s[name].id, DAY).token;
    server = createAuthServer({ db: s.db, log: quiet, inviteUrlBase: 'https://weddinggpt.app/join/' });
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => {
    server.close();
    s.db.close();
  });

  const call = (method, path, { token, body } = {}) => {
    ip += 1;
    return fetch(`${base}${path}`, {
      method,
      headers: {
        'X-Forwarded-For': `10.2.0.${ip}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  };
  const invitesPath = () => `/v1/workspaces/${s.workspace.id}/invites`;

  it('the owner creates a link, and the partner joins with it', async () => {
    const created = await call('POST', invitesPath(), { token: tokens.priya });
    assert.equal(created.status, 201);
    const { token, url } = await created.json();
    assert.equal(url, `https://weddinggpt.app/join/${token}`);

    const joined = await call('POST', '/v1/invites/accept', { token: tokens.sam, body: { token } });
    assert.equal(joined.status, 200);
    const body = await joined.json();
    assert.deepEqual([body.workspace.id, body.workspace.role, body.alreadyMember], [s.workspace.id, Role.PARTNER, false]);

    const members = await (await call('GET', `/v1/workspaces/${s.workspace.id}/members`, { token: tokens.priya })).json();
    assert.deepEqual(
      members.members.map((m) => m.name),
      ['priya', 'sam']
    );
  });

  it('T4: only the owner can create or revoke invites', async () => {
    assert.equal((await call('POST', invitesPath(), { token: tokens.sam })).status, 403);
    assert.equal((await call('DELETE', invitesPath(), { token: tokens.sam })).status, 403);
    // Not a member at all: the workspace is not even acknowledged.
    assert.equal((await call('POST', invitesPath(), { token: tokens.jo })).status, 404);
  });

  it('T4: accepting needs a signed-in account', async () => {
    const { token } = await (await call('POST', invitesPath(), { token: tokens.priya })).json();
    assert.equal((await call('POST', '/v1/invites/accept', { body: { token } })).status, 401);
  });

  it('answers the same for used, revoked and made-up tokens', async () => {
    const { token } = await (await call('POST', invitesPath(), { token: tokens.priya })).json();
    assert.equal((await call('DELETE', invitesPath(), { token: tokens.priya })).status, 204);
    const revoked = await call('POST', '/v1/invites/accept', { token: tokens.jo, body: { token } });
    const madeUp = await call('POST', '/v1/invites/accept', { token: tokens.jo, body: { token: 'x'.repeat(43) } });
    assert.equal(revoked.status, 404);
    assert.equal(madeUp.status, 404);
    assert.deepEqual(await revoked.json(), await madeUp.json());
  });

  it('says when the wedding already has two people', async () => {
    const { token } = await (await call('POST', invitesPath(), { token: tokens.priya })).json();
    const full = await call('POST', '/v1/invites/accept', { token: tokens.jo, body: { token } });
    assert.equal(full.status, 409);
    assert.deepEqual(await full.json(), { error: 'workspace_full' });
  });

  it('a joined partner can sync, and can leave', async () => {
    const pushed = await call('POST', `/v1/workspaces/${s.workspace.id}/sync/push`, {
      token: tokens.sam,
      body: {
        mutations: [{ mutationId: 'mut_sam_1', collection: 'tasks', id: 'task_sam', op: 'upsert', baseVersion: 0, data: {} }],
      },
    });
    assert.equal(pushed.status, 200);
    const left = await call('DELETE', `/v1/workspaces/${s.workspace.id}/members/${s.sam.id}`, { token: tokens.sam });
    assert.equal(left.status, 204);
    assert.equal((await call('GET', `/v1/workspaces/${s.workspace.id}/sync/pull`, { token: tokens.sam })).status, 404);
  });
});
