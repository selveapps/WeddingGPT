import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createAuthServer } from './app.mjs';
import { openDatabase } from './db.mjs';
import { Op, SYNC_LIMITS, parsePullQuery, validateMutation } from './sync.mjs';
import { Role } from './workspaces.mjs';

const quiet = { info() {}, error() {} };
const DAY = 24 * 60 * 60 * 1000;

let counter = 0;
const mid = () => `mut_${++counter}`;
const upsert = (id, data, baseVersion = 0, extra = {}) => ({
  mutationId: mid(),
  collection: 'tasks',
  id,
  op: Op.UPSERT,
  baseVersion,
  data,
  ...extra,
});
const remove = (id, baseVersion) => ({ mutationId: mid(), collection: 'tasks', id, op: Op.DELETE, baseVersion });

/** A database with two users who share one workspace, and a third with their own. */
function setup() {
  const db = openDatabase(':memory:');
  const user = (name) => db.createUser({ email: `${name}@example.com`, name, passwordHash: 'x' });
  const priya = user('priya');
  const sam = user('sam');
  const outsider = user('outsider');
  const shared = db.workspaces.create(priya.id, 'Priya and Sam');
  db.workspaces.addMember(shared.id, sam.id, Role.PARTNER);
  const other = db.workspaces.create(outsider.id, 'Someone else');
  return { db, priya, sam, outsider, shared, other };
}

describe('validateMutation', () => {
  it('accepts a well-formed upsert and delete', () => {
    assert.equal(validateMutation(upsert('task_1', { title: 'Book venue' })), null);
    assert.equal(validateMutation(remove('task_1', 3)), null);
    assert.equal(validateMutation({ ...upsert('task_1', {}), baseVersion: undefined }), null);
  });

  it('rejects bad shapes, unknown collections and oversized records', () => {
    assert.equal(validateMutation(null), 'invalid');
    assert.equal(validateMutation({ ...upsert('task_1', {}), mutationId: 'has spaces' }), 'invalid');
    assert.equal(validateMutation({ ...upsert('task_1', {}), collection: 'users' }), 'unknown_collection');
    assert.equal(validateMutation({ ...upsert('task_1', {}), id: '../etc' }), 'invalid');
    assert.equal(validateMutation({ ...upsert('task_1', {}), op: 'drop' }), 'invalid');
    assert.equal(validateMutation({ ...upsert('task_1', {}), baseVersion: -1 }), 'invalid');
    assert.equal(validateMutation({ ...upsert('task_1', {}), baseVersion: 1.5 }), 'invalid');
    assert.equal(validateMutation(upsert('task_1', [])), 'invalid');
    assert.equal(validateMutation(upsert('task_1', { notes: 'x'.repeat(SYNC_LIMITS.recordBytes) })), 'too_large');
  });

  it('T2: a record cannot claim a different id inside its data', () => {
    assert.equal(validateMutation(upsert('task_1', { id: 'task_2' })), 'invalid');
    assert.equal(validateMutation(upsert('task_1', { id: 'task_1' })), null);
  });
});

describe('parsePullQuery', () => {
  it('defaults and validates since and limit', () => {
    assert.deepEqual(parsePullQuery({}), { since: 0, limit: SYNC_LIMITS.pullDefault });
    assert.deepEqual(parsePullQuery({ since: '12', limit: '50' }), { since: 12, limit: 50 });
    assert.equal(parsePullQuery({ since: '-1' }), null);
    assert.equal(parsePullQuery({ since: 'abc' }), null);
    assert.equal(parsePullQuery({ limit: '0' }), null);
    assert.equal(parsePullQuery({ limit: String(SYNC_LIMITS.pullMax + 1) }), null);
  });
});

describe('push and pull', () => {
  let s;
  beforeEach(() => {
    s = setup();
  });

  it('round-trips a new record', () => {
    const pushed = s.db.sync.push(s.shared.id, s.priya.id, [upsert('task_1', { title: 'Book venue' })]);
    assert.equal(pushed.applied.length, 1);
    assert.equal(pushed.applied[0].version, 1);
    assert.deepEqual(pushed.conflicts, []);

    const pulled = s.db.sync.pull(s.shared.id, s.sam.id);
    assert.equal(pulled.records.length, 1);
    assert.deepEqual(pulled.records[0], {
      collection: 'tasks',
      id: 'task_1',
      version: 1,
      updatedAt: pulled.records[0].updatedAt,
      updatedBy: s.priya.id,
      deletedAt: null,
      data: { title: 'Book venue' },
    });
    assert.equal(pulled.cursor, pushed.applied[0].seq);
    assert.equal(pulled.hasMore, false);
  });

  it('updates without conflict when the base version matches', () => {
    s.db.sync.push(s.shared.id, s.priya.id, [upsert('task_1', { title: 'v1' })]);
    const second = s.db.sync.push(s.shared.id, s.sam.id, [upsert('task_1', { title: 'v2' }, 1)]);
    assert.equal(second.applied[0].version, 2);
    assert.deepEqual(second.conflicts, []);
  });

  it('pulls only what changed since the cursor', () => {
    s.db.sync.push(s.shared.id, s.priya.id, [upsert('task_1', { n: 1 })]);
    const { cursor } = s.db.sync.pull(s.shared.id, s.sam.id);
    s.db.sync.push(s.shared.id, s.priya.id, [upsert('task_2', { n: 2 })]);
    const next = s.db.sync.pull(s.shared.id, s.sam.id, { since: cursor });
    assert.deepEqual(next.records.map((r) => r.id), ['task_2']);
    assert.equal(s.db.sync.pull(s.shared.id, s.sam.id, { since: next.cursor }).records.length, 0);
  });

  it('pages through large pulls', () => {
    s.db.sync.push(
      s.shared.id,
      s.priya.id,
      ['a', 'b', 'c', 'd', 'e'].map((id) => upsert(`task_${id}`, { id: `task_${id}` }))
    );
    const first = s.db.sync.pull(s.shared.id, s.sam.id, { since: 0, limit: 2 });
    assert.deepEqual([first.records.length, first.hasMore], [2, true]);
    const second = s.db.sync.pull(s.shared.id, s.sam.id, { since: first.cursor, limit: 2 });
    const third = s.db.sync.pull(s.shared.id, s.sam.id, { since: second.cursor, limit: 2 });
    assert.deepEqual(
      [...first.records, ...second.records, ...third.records].map((r) => r.id),
      ['task_a', 'task_b', 'task_c', 'task_d', 'task_e']
    );
    assert.equal(third.hasMore, false);
  });

  it('rejects bad mutations one by one and applies the rest', () => {
    const result = s.db.sync.push(s.shared.id, s.priya.id, [
      upsert('task_1', { ok: true }),
      { ...upsert('task_2', {}), collection: 'secrets' },
      'not even an object',
    ]);
    assert.equal(result.applied.length, 1);
    assert.deepEqual(
      result.rejected.map((r) => r.error),
      ['unknown_collection', 'invalid']
    );
  });

  it('gives every write a new, increasing seq across workspaces', () => {
    const a = s.db.sync.push(s.shared.id, s.priya.id, [upsert('task_1', {})]).applied[0].seq;
    const b = s.db.sync.push(s.other.id, s.outsider.id, [upsert('task_1', {})]).applied[0].seq;
    const c = s.db.sync.push(s.shared.id, s.priya.id, [upsert('task_1', {}, 1)]).applied[0].seq;
    assert.ok(a < b && b < c);
  });
});

describe('T10: replayed pushes apply once', () => {
  it('returns the original result for a repeated mutation id', () => {
    const s = setup();
    const mutation = upsert('task_1', { title: 'once' });
    const first = s.db.sync.push(s.shared.id, s.priya.id, [mutation]);
    const again = s.db.sync.push(s.shared.id, s.priya.id, [{ ...mutation, data: { title: 'twice' } }]);
    assert.deepEqual(again.applied, first.applied);
    const [record] = s.db.sync.pull(s.shared.id, s.priya.id).records;
    assert.deepEqual([record.version, record.data], [1, { title: 'once' }]);
  });

  it('treats a duplicate inside one batch the same way', () => {
    const s = setup();
    const mutation = upsert('task_1', { n: 1 });
    const result = s.db.sync.push(s.shared.id, s.priya.id, [mutation, mutation]);
    assert.equal(result.applied[0].seq, result.applied[1].seq);
    assert.equal(s.db.sync.pull(s.shared.id, s.priya.id).records[0].version, 1);
  });
});

describe('T11: conflicting edits are never lost silently', () => {
  it('the later push wins and returns the copy it overwrote', () => {
    const s = setup();
    s.db.sync.push(s.shared.id, s.priya.id, [upsert('task_1', { title: 'Book venue' })]);
    // Both phones last saw version 1 and edit offline.
    s.db.sync.push(s.shared.id, s.priya.id, [upsert('task_1', { title: 'Book the barn' }, 1)]);
    const sams = s.db.sync.push(s.shared.id, s.sam.id, [upsert('task_1', { title: 'Book the garden' }, 1)]);

    assert.equal(sams.applied[0].version, 3);
    assert.equal(sams.conflicts.length, 1);
    assert.deepEqual(sams.conflicts[0].overwritten.data, { title: 'Book the barn' });
    assert.equal(sams.conflicts[0].overwritten.updatedBy, s.priya.id);
    assert.equal(s.db.sync.pull(s.shared.id, s.priya.id).records[0].data.title, 'Book the garden');
  });

  it('a delete over someone else\'s edit returns their edit', () => {
    const s = setup();
    s.db.sync.push(s.shared.id, s.priya.id, [upsert('task_1', { title: 'v1' })]);
    s.db.sync.push(s.shared.id, s.priya.id, [upsert('task_1', { title: 'v2' }, 1)]);
    const deleted = s.db.sync.push(s.shared.id, s.sam.id, [remove('task_1', 1)]);
    assert.deepEqual(deleted.conflicts[0].overwritten.data, { title: 'v2' });
  });
});

describe('tombstones', () => {
  it('a delete keeps the row with its contents removed', () => {
    const s = setup();
    s.db.sync.push(s.shared.id, s.priya.id, [upsert('task_1', { phone: '555 0100', diet: 'nut allergy' })]);
    s.db.sync.push(s.shared.id, s.priya.id, [remove('task_1', 1)]);
    const [record] = s.db.sync.pull(s.shared.id, s.sam.id).records;
    assert.equal(record.version, 2);
    assert.ok(record.deletedAt);
    assert.equal(record.data, null);
  });

  it('an upsert after a delete brings the record back', () => {
    const s = setup();
    s.db.sync.push(s.shared.id, s.priya.id, [upsert('task_1', { n: 1 })]);
    s.db.sync.push(s.shared.id, s.priya.id, [remove('task_1', 1)]);
    s.db.sync.push(s.shared.id, s.priya.id, [upsert('task_1', { n: 2 }, 2)]);
    const [record] = s.db.sync.pull(s.shared.id, s.priya.id).records;
    assert.deepEqual([record.version, record.deletedAt, record.data], [3, null, { n: 2 }]);
  });

  it('old tombstones are purged only after every member has pulled past them', () => {
    const s = setup();
    s.db.sync.push(s.shared.id, s.priya.id, [upsert('task_1', {})]);
    s.db.sync.push(s.shared.id, s.priya.id, [remove('task_1', 1)]);
    const later = new Date(Date.now() + (SYNC_LIMITS.tombstoneDays + 1) * DAY);

    s.db.sync.pull(s.shared.id, s.priya.id);
    assert.equal(s.db.sync.compact({ now: later }).tombstones, 0, 'Sam has not synced yet');

    s.db.sync.pull(s.shared.id, s.sam.id);
    assert.equal(s.db.sync.compact({ now: later }).tombstones, 1);
    assert.equal(s.db.sync.pull(s.shared.id, s.sam.id, { since: 0 }).records.length, 0);
  });

  it('keeps recent tombstones and never reuses a seq after a purge', () => {
    const s = setup();
    s.db.sync.push(s.shared.id, s.priya.id, [upsert('task_1', {})]);
    const deleted = s.db.sync.push(s.shared.id, s.priya.id, [remove('task_1', 1)]).applied[0].seq;
    s.db.sync.pull(s.shared.id, s.priya.id);
    s.db.sync.pull(s.shared.id, s.sam.id);
    assert.equal(s.db.sync.compact().tombstones, 0);

    s.db.sync.compact({ now: new Date(Date.now() + (SYNC_LIMITS.tombstoneDays + 1) * DAY) });
    const next = s.db.sync.push(s.shared.id, s.priya.id, [upsert('task_2', {})]).applied[0].seq;
    assert.ok(next > deleted);
  });

  it('forgets old mutation ids', () => {
    const s = setup();
    s.db.sync.push(s.shared.id, s.priya.id, [upsert('task_1', {})]);
    const later = new Date(Date.now() + (SYNC_LIMITS.mutationDays + 1) * DAY);
    assert.equal(s.db.sync.compact({ now: later }).mutations, 1);
  });
});

describe('T9: storage limits', () => {
  it('stops new records at the workspace quota but still allows edits and deletes', () => {
    const s = setup();
    const original = SYNC_LIMITS.recordsPerWorkspace;
    SYNC_LIMITS.recordsPerWorkspace = 2;
    try {
      const result = s.db.sync.push(s.shared.id, s.priya.id, [
        upsert('task_1', {}),
        upsert('task_2', {}),
        upsert('task_3', {}),
        upsert('task_1', { edited: true }, 1),
        remove('task_2', 1),
        upsert('task_3', {}),
      ]);
      assert.deepEqual(
        result.rejected.map((r) => r.error),
        ['quota_exceeded']
      );
      assert.equal(result.applied.length, 5);
    } finally {
      SYNC_LIMITS.recordsPerWorkspace = original;
    }
  });
});

describe('sync API', () => {
  let s;
  let server;
  let base;
  const tokens = {};

  before(async () => {
    s = setup();
    for (const name of ['priya', 'sam', 'outsider']) tokens[name] = s.db.createSession(s[name].id, DAY).token;
    server = createAuthServer({ db: s.db, log: quiet });
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => {
    server.close();
    s.db.close();
  });

  const push = (workspaceId, token, body) =>
    fetch(`${base}/v1/workspaces/${workspaceId}/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  const pull = (workspaceId, token, query = '') =>
    fetch(`${base}/v1/workspaces/${workspaceId}/sync/pull${query}`, { headers: { Authorization: `Bearer ${token}` } });

  it('pushes and pulls over HTTP', async () => {
    const pushed = await push(s.shared.id, tokens.priya, { mutations: [upsert('task_http', { title: 'x' })] });
    assert.equal(pushed.status, 200);
    assert.equal((await pushed.json()).applied.length, 1);

    const pulled = await pull(s.shared.id, tokens.sam, '?since=0');
    assert.equal(pulled.status, 200);
    assert.ok((await pulled.json()).records.some((r) => r.id === 'task_http'));
  });

  it('T1: a non-member cannot push to or pull from a workspace', async () => {
    const pushed = await push(s.shared.id, tokens.outsider, { mutations: [upsert('task_evil', {})] });
    assert.equal(pushed.status, 404);
    assert.equal((await pull(s.shared.id, tokens.outsider)).status, 404);
    const ids = s.db.sync.pull(s.shared.id, s.priya.id).records.map((r) => r.id);
    assert.ok(!ids.includes('task_evil'));
  });

  it('T2: the same record id in two workspaces stays separate', async () => {
    await push(s.shared.id, tokens.priya, { mutations: [upsert('task_same', { owner: 'shared' })] });
    await push(s.other.id, tokens.outsider, { mutations: [upsert('task_same', { owner: 'other' })] });
    const shared = (await (await pull(s.shared.id, tokens.priya)).json()).records.find((r) => r.id === 'task_same');
    const other = (await (await pull(s.other.id, tokens.outsider)).json()).records.find((r) => r.id === 'task_same');
    assert.deepEqual([shared.data.owner, shared.version], ['shared', 1]);
    assert.deepEqual([other.data.owner, other.version], ['other', 1]);
  });

  it('T9: rejects empty, oversized and over-long batches', async () => {
    assert.equal((await push(s.shared.id, tokens.priya, { mutations: [] })).status, 400);
    assert.equal((await push(s.shared.id, tokens.priya, {})).status, 400);
    assert.equal((await push(s.shared.id, tokens.priya, '{nope')).status, 400);

    const tooMany = Array.from({ length: SYNC_LIMITS.mutationsPerPush + 1 }, (_, i) => upsert(`task_m${i}`, {}));
    assert.equal((await push(s.shared.id, tokens.priya, { mutations: tooMany })).status, 413);

    const huge = { mutations: [upsert('task_big', { notes: 'x'.repeat(SYNC_LIMITS.requestBytes) })] };
    assert.equal((await push(s.shared.id, tokens.priya, huge)).status, 413);
  });

  it('rejects a bad pull query', async () => {
    assert.equal((await pull(s.shared.id, tokens.priya, '?since=-5')).status, 400);
    assert.equal((await pull(s.shared.id, tokens.priya, '?limit=100000')).status, 400);
  });

  it('requires a session', async () => {
    assert.equal((await pull(s.shared.id, 'made-up')).status, 401);
  });
});
