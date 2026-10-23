import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createAuthServer } from './app.mjs';
import { openDatabase } from './db.mjs';
import { createRouter } from './router.mjs';
import { Role, WORKSPACE_LIMITS, canRemoveMember, validateWorkspaceName } from './workspaces.mjs';

const quiet = { info() {}, error() {} };

describe('router', () => {
  const router = createRouter()
    .add('GET', '/v1/things', 'list')
    .add('GET', '/v1/things/:id/parts/:partId', 'part');

  it('matches params and query, ignoring a trailing slash', () => {
    assert.deepEqual(router.match('GET', '/v1/things/a%20b/parts/7?since=3'), {
      handler: 'part',
      options: {},
      params: { id: 'a b', partId: '7' },
      query: { since: '3' },
    });
    assert.equal(router.match('GET', '/v1/things/').handler, 'list');
  });

  it('tells a wrong method from a missing path', () => {
    assert.deepEqual(router.match('POST', '/v1/things'), { methodNotAllowed: true });
    assert.equal(router.match('GET', '/v1/nothing'), null);
    assert.equal(router.match('GET', '/v1/things/x/parts'), null);
  });
});

describe('workspace rules', () => {
  it('validates names', () => {
    assert.equal(validateWorkspaceName('Priya and Sam'), null);
    assert.deepEqual(validateWorkspaceName('   '), { name: 'required' });
    assert.deepEqual(validateWorkspaceName(undefined), { name: 'required' });
    assert.deepEqual(validateWorkspaceName('x'.repeat(WORKSPACE_LIMITS.nameChars + 1)), { name: 'too_long' });
  });

  it('lets the owner remove a partner and a partner leave, nothing else', () => {
    const owner = { actorRole: Role.OWNER, actorId: 'o' };
    const partner = { actorRole: Role.PARTNER, actorId: 'p' };
    assert.equal(canRemoveMember({ ...owner, targetRole: Role.PARTNER, targetId: 'p' }), true);
    assert.equal(canRemoveMember({ ...partner, targetRole: Role.PARTNER, targetId: 'p' }), true);
    assert.equal(canRemoveMember({ ...owner, targetRole: Role.OWNER, targetId: 'o' }), false);
    assert.equal(canRemoveMember({ ...partner, targetRole: Role.OWNER, targetId: 'o' }), false);
  });
});

describe('workspace API', () => {
  let db;
  let server;
  let base;
  let ip = 0;

  before(async () => {
    db = openDatabase(':memory:');
    server = createAuthServer({ db, log: quiet });
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => {
    server.close();
    db.close();
  });

  // A fresh address per request keeps the per-IP rate limit out of these tests.
  const call = (method, path, { token, body } = {}) => {
    ip += 1;
    return fetch(`${base}${path}`, {
      method,
      headers: {
        'X-Forwarded-For': `10.1.${Math.floor(ip / 250)}.${ip % 250}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  let accounts = 0;
  async function signUp(name) {
    accounts += 1;
    const response = await call('POST', '/v1/auth/register', {
      body: { name, email: `${name.toLowerCase()}${accounts}@example.com`, password: 'a long password' },
    });
    const { user, token } = await response.json();
    return { id: user.id, token };
  }

  async function newWorkspace(token, name = 'Our wedding') {
    const response = await call('POST', '/v1/workspaces', { token, body: { name } });
    assert.equal(response.status, 201);
    return (await response.json()).workspace;
  }

  it('creates a workspace with the caller as owner and lists it', async () => {
    const priya = await signUp('Priya');
    const workspace = await newWorkspace(priya.token, '  Priya and Sam  ');
    assert.match(workspace.id, /^ws_/);
    assert.equal(workspace.name, 'Priya and Sam');
    assert.equal(workspace.role, Role.OWNER);

    const list = await (await call('GET', '/v1/workspaces', { token: priya.token })).json();
    assert.deepEqual(
      list.workspaces.map((w) => [w.id, w.role]),
      [[workspace.id, Role.OWNER]]
    );

    const members = await (await call('GET', `/v1/workspaces/${workspace.id}/members`, { token: priya.token })).json();
    assert.deepEqual(
      members.members.map((m) => [m.userId, m.name, m.role]),
      [[priya.id, 'Priya', Role.OWNER]]
    );
    assert.equal(members.members[0].email, undefined);
  });

  it('rejects bad names and stops at the per-user limit', async () => {
    const jo = await signUp('Jo');
    const bad = await call('POST', '/v1/workspaces', { token: jo.token, body: { name: '' } });
    assert.equal(bad.status, 400);
    assert.deepEqual(await bad.json(), { error: 'invalid', fields: { name: 'required' } });

    for (let i = 0; i < WORKSPACE_LIMITS.perUser; i += 1) await newWorkspace(jo.token, `W${i}`);
    const over = await call('POST', '/v1/workspaces', { token: jo.token, body: { name: 'One more' } });
    assert.equal(over.status, 403);
    assert.deepEqual(await over.json(), { error: 'limit_reached' });
  });

  it('requires a session', async () => {
    assert.equal((await call('GET', '/v1/workspaces')).status, 401);
    assert.equal((await call('GET', '/v1/workspaces', { token: 'made-up' })).status, 401);
    assert.equal((await call('POST', '/v1/workspaces', { body: { name: 'x' } })).status, 401);
  });

  it('answers a wrong method with 405', async () => {
    const ana = await signUp('Ana');
    assert.equal((await call('DELETE', '/v1/workspaces', { token: ana.token })).status, 405);
  });

  describe('T1: another user cannot reach a workspace by its id', () => {
    it('returns the same 404 for a real workspace and a made-up one', async () => {
      const owner = await signUp('Owner');
      const outsider = await signUp('Outsider');
      const workspace = await newWorkspace(owner.token);

      const real = await call('GET', `/v1/workspaces/${workspace.id}/members`, { token: outsider.token });
      const fake = await call('GET', '/v1/workspaces/ws_does-not-exist/members', { token: outsider.token });
      assert.equal(real.status, 404);
      assert.equal(fake.status, 404);
      assert.deepEqual(await real.json(), await fake.json());
    });

    it('cannot remove members or see the workspace in its own list', async () => {
      const owner = await signUp('Owner');
      const outsider = await signUp('Outsider');
      const workspace = await newWorkspace(owner.token);

      const removal = await call('DELETE', `/v1/workspaces/${workspace.id}/members/${owner.id}`, {
        token: outsider.token,
      });
      assert.equal(removal.status, 404);
      assert.equal(db.workspaces.membership(workspace.id, owner.id).role, Role.OWNER);

      const list = await (await call('GET', '/v1/workspaces', { token: outsider.token })).json();
      assert.deepEqual(list.workspaces, []);
    });
  });

  describe('T2: ids from one workspace do not reach into another', () => {
    it('removing a user id that belongs to a different workspace changes nothing', async () => {
      const a = await signUp('Alpha');
      const b = await signUp('Beta');
      const workspaceA = await newWorkspace(a.token);
      const workspaceB = await newWorkspace(b.token);

      // Alpha names Beta's user id, but through Alpha's own workspace.
      const response = await call('DELETE', `/v1/workspaces/${workspaceA.id}/members/${b.id}`, { token: a.token });
      assert.equal(response.status, 404);
      assert.equal(db.workspaces.membership(workspaceB.id, b.id).role, Role.OWNER);
    });
  });

  describe('T3: a removed partner loses access on the next request', () => {
    it('the owner removes a partner, whose session still works elsewhere but not here', async () => {
      const owner = await signUp('Owner');
      const partner = await signUp('Partner');
      const workspace = await newWorkspace(owner.token);
      db.workspaces.addMember(workspace.id, partner.id, Role.PARTNER);

      const before = await call('GET', `/v1/workspaces/${workspace.id}/members`, { token: partner.token });
      assert.equal(before.status, 200);

      const removed = await call('DELETE', `/v1/workspaces/${workspace.id}/members/${partner.id}`, {
        token: owner.token,
      });
      assert.equal(removed.status, 204);

      const afterRemoval = await call('GET', `/v1/workspaces/${workspace.id}/members`, { token: partner.token });
      assert.equal(afterRemoval.status, 404);
      assert.equal((await call('GET', '/v1/auth/me', { token: partner.token })).status, 200);
    });

    it('a partner can leave but cannot remove the owner, and the owner cannot leave', async () => {
      const owner = await signUp('Owner');
      const partner = await signUp('Partner');
      const workspace = await newWorkspace(owner.token);
      db.workspaces.addMember(workspace.id, partner.id, Role.PARTNER);
      const path = (userId) => `/v1/workspaces/${workspace.id}/members/${userId}`;

      assert.equal((await call('DELETE', path(owner.id), { token: partner.token })).status, 403);
      assert.equal((await call('DELETE', path(owner.id), { token: owner.token })).status, 403);
      assert.equal((await call('DELETE', path(partner.id), { token: partner.token })).status, 204);
      assert.equal(db.workspaces.membership(workspace.id, partner.id), null);
      assert.equal(db.workspaces.membership(workspace.id, owner.id).role, Role.OWNER);
    });

    it('removing someone who is not a member is a 404', async () => {
      const owner = await signUp('Owner');
      const workspace = await newWorkspace(owner.token);
      const response = await call('DELETE', `/v1/workspaces/${workspace.id}/members/user_nobody`, {
        token: owner.token,
      });
      assert.equal(response.status, 404);
    });
  });

  it('lists the owner first, then partners', async () => {
    const owner = await signUp('Owner');
    const partner = await signUp('Partner');
    const workspace = await newWorkspace(owner.token);
    db.workspaces.addMember(workspace.id, partner.id, Role.PARTNER);

    const { members } = await (await call('GET', `/v1/workspaces/${workspace.id}/members`, { token: partner.token })).json();
    assert.deepEqual(
      members.map((m) => m.role),
      [Role.OWNER, Role.PARTNER]
    );
  });
});
