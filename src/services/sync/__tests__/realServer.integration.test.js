/**
 * @jest-environment node
 */
import http from 'http';
import { create } from 'zustand';

import { createSyncClient } from '../syncClient';
import { createSyncEngine } from '../syncEngine';
import { SliceKind } from '../changes';
import { createSyncStore } from '../../../store/syncStore';

/**
 * The real client and engine against a running server/auth - the check that
 * the fake server in unit tests matches the real protocol.
 *
 * Opt-in, because it needs a server:
 *   cd server/auth && AUTH_DB_PATH=/tmp/it.db PORT=8790 node index.mjs
 *   SYNC_SERVER_URL=http://127.0.0.1:8790 npx jest realServer
 */
const URL_ = process.env.SYNC_SERVER_URL;
const run = URL_ ? describe : describe.skip;

/**
 * Expo replaces the global fetch, and its version cannot read real responses
 * under Jest, so the client gets this minimal one over Node's http module.
 */
function nodeFetch(url, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const request = http.request(url, { method, headers }, (response) => {
      let text = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        text += chunk;
      });
      response.on('end', () =>
        resolve({
          ok: response.statusCode >= 200 && response.statusCode < 300,
          status: response.statusCode,
          json: async () => JSON.parse(text),
        })
      );
    });
    request.on('error', reject);
    if (body) request.write(body);
    request.end();
  });
}

run('sync against the real server', () => {
  let token;
  let workspaceId;
  const client = URL_ ? createSyncClient({ url: URL_, fetchImpl: nodeFetch }) : null;

  beforeAll(async () => {
    const response = await nodeFetch(`${URL_}/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `10.9.${Date.now() % 250}.1` },
      body: JSON.stringify({ email: `it-${Date.now()}@example.com`, password: 'integration-pass' }),
    });
    ({ token } = await response.json());
    workspaceId = (await client.createWorkspace(token, 'Integration wedding')).id;
  });

  function phone() {
    const tasks = create(() => ({ tasks: { byId: {}, allIds: [] } }));
    const syncStore = createSyncStore({ persisted: false });
    const engine = createSyncEngine({
      client,
      syncStore,
      slices: [{ collection: 'tasks', store: tasks, key: 'tasks', kind: SliceKind.MANY }],
      getSession: () => ({ token, workspaceId }),
      setTimer: () => 0,
      clearTimer: () => {},
    });
    engine.attach();
    const set = (id, title) =>
      tasks.setState((s) => ({
        tasks: {
          byId: { ...s.tasks.byId, [id]: { id, title } },
          allIds: s.tasks.allIds.includes(id) ? s.tasks.allIds : [...s.tasks.allIds, id],
        },
      }));
    const remove = (id) =>
      tasks.setState((s) => {
        const byId = { ...s.tasks.byId };
        delete byId[id];
        return { tasks: { byId, allIds: s.tasks.allIds.filter((x) => x !== id) } };
      });
    const titles = () => tasks.getState().tasks.allIds.map((id) => tasks.getState().tasks.byId[id].title);
    return { engine, syncStore, set, remove, titles };
  }

  it('lists the workspace it created', async () => {
    const workspaces = await client.listWorkspaces(token);
    expect(workspaces.map((w) => w.id)).toContain(workspaceId);
  });

  it('syncs edits, deletes and conflicts between two phones', async () => {
    const a = phone();
    const b = phone();

    a.set('task_1', 'Book venue');
    a.set('task_2', 'Order cake');
    expect(await a.engine.syncNow()).toMatchObject({ pending: 0 });
    await b.engine.syncNow();
    expect(b.titles()).toEqual(['Book venue', 'Order cake']);

    b.remove('task_2');
    await b.engine.syncNow();
    await a.engine.syncNow();
    expect(a.titles()).toEqual(['Book venue']);

    // Both edit task_1 from the same version.
    a.set('task_1', 'Book the barn');
    b.set('task_1', 'Book the garden');
    await a.engine.syncNow();
    await b.engine.syncNow();
    const [conflict] = b.syncStore.getState().conflicts;
    expect(conflict.overwritten.data.title).toBe('Book the barn');

    await a.engine.syncNow();
    expect(a.titles()).toEqual(['Book the garden']);
    expect(a.syncStore.getState().outbox).toEqual([]);
    expect(b.syncStore.getState().outbox).toEqual([]);
  });

  it('reports a workspace it cannot reach as gone', async () => {
    const onGone = jest.fn();
    const engine = createSyncEngine({
      client,
      syncStore: createSyncStore({ persisted: false }),
      slices: [],
      getSession: () => ({ token, workspaceId: 'ws_not-mine' }),
      onGone,
    });
    expect(await engine.syncNow()).toMatchObject({ error: 'gone' });
    expect(onGone).toHaveBeenCalledWith('ws_not-mine');
  });
});
