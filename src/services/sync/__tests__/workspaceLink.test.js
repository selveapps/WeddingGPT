import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createWorkspaceLink } from '../workspaceLink';
import { createSyncEngine } from '../syncEngine';
import { SliceKind } from '../changes';
import { createMemoryStorageService } from '../../storage/memoryStorageService';
import { createWorkspaceStorage, LOCAL_WORKSPACE } from '../../storage/workspaceStorage';
import { createSyncStore } from '../../../store/syncStore';
import { createFakeSyncServer } from '../../../test/fakeSyncServer';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/** A phone with real workspace-scoped persistence, like the app. */
async function makePhone(server, { token = 'priya' } = {}) {
  const storage = createMemoryStorageService();
  const workspaces = createWorkspaceStorage(storage);

  const persisted = (name, initial) =>
    workspaces.register(create()(persist(() => initial, { name, storage: workspaces.adapter })));
  const tasks = persisted('planning:store', { tasks: { byId: {}, allIds: [] }, seededAt: null });
  const wedding = persisted('wedding:store', { wedding: null, onboardingStatus: 'not_started' });

  const syncState = workspaces.register(createSyncStore({ storage: workspaces.adapter }));

  const engine = createSyncEngine({
    client: server.client,
    syncStore: syncState,
    slices: [
      { collection: 'tasks', store: tasks, key: 'tasks', kind: SliceKind.MANY },
      { collection: 'wedding', store: wedding, key: 'wedding', kind: SliceKind.ONE },
    ],
    getSession: () =>
      workspaces.getActive() === LOCAL_WORKSPACE ? null : { token, workspaceId: workspaces.getActive() },
    debounceMs: 0,
    setTimer: () => 0,
    clearTimer: () => {},
  });

  const link = createWorkspaceLink({
    client: server.client,
    engine,
    workspaceStorage: workspaces,
    syncStore: syncState,
    getToken: () => token,
  });

  await workspaces.ready;
  await Promise.all([tasks, wedding, syncState].map((store) => store.persist.rehydrate()));
  engine.attach();

  const addTask = (id, title = id) =>
    tasks.setState((s) => ({
      tasks: { byId: { ...s.tasks.byId, [id]: { id, title } }, allIds: [...s.tasks.allIds, id] },
    }));
  const titles = () => tasks.getState().tasks.allIds.map((id) => tasks.getState().tasks.byId[id].title);

  return { storage, workspaces, tasks, wedding, syncState, engine, link, addTask, titles };
}

/** The fake server, plus the two workspace endpoints the link uses. */
function makeServer() {
  const server = createFakeSyncServer();
  const owned = [];
  server.client.listWorkspaces = async () => owned;
  server.client.createWorkspace = async (token, name) => {
    const workspace = { id: `ws_${owned.length + 1}`, name, role: 'owner' };
    owned.push(workspace);
    return workspace;
  };
  return server;
}

describe('workspace link', () => {
  it('uploads the phone wedding into a new workspace, keeping everything', async () => {
    const server = makeServer();
    const phone = await makePhone(server);
    phone.wedding.setState({ wedding: { id: 'wed_1', city: 'Austin' }, onboardingStatus: 'completed' });
    phone.addTask('task_1', 'Book venue');
    phone.tasks.setState({ seededAt: '2027-01-01' });
    await settle();

    const { workspace, queued } = await phone.link.uploadThisWedding('Priya and Sam');

    expect(workspace.id).toBe('ws_1');
    expect(phone.workspaces.getActive()).toBe('ws_1');
    expect(queued).toBe(2);
    // Synced and unsynced state both came across.
    expect(phone.titles()).toEqual(['Book venue']);
    expect(phone.wedding.getState().onboardingStatus).toBe('completed');
    expect(phone.tasks.getState().seededAt).toBe('2027-01-01');
    // On the server, and the outbox is empty.
    expect(server.record('ws_1', 'tasks', 'task_1').data.title).toBe('Book venue');
    expect(server.record('ws_1', 'wedding', 'wed_1')).toBeDefined();
    expect(phone.syncState.getState().outbox).toEqual([]);
    // Saved under the workspace's own keys; the local copy is untouched.
    await settle();
    expect((await phone.storage.get('ws:ws_1:planning:store')).state.tasks.allIds).toEqual(['task_1']);
    expect((await phone.storage.get('planning:store')).state.tasks.allIds).toEqual(['task_1']);
  });

  it("opens an account's wedding on a second phone without touching that phone's own wedding", async () => {
    const server = makeServer();
    const priya = await makePhone(server, { token: 'priya' });
    priya.addTask('task_1', 'Book venue');
    await priya.link.uploadThisWedding('Priya and Sam');

    const sam = await makePhone(server, { token: 'sam' });
    sam.addTask('task_local', 'Sam local idea');
    await settle();

    const [workspace] = await sam.link.listAccountWorkspaces();
    await sam.link.openAccountWorkspace(workspace);
    expect(sam.titles()).toEqual(['Book venue']);
    // Opening never uploads Sam's local wedding into the shared one.
    expect(server.record('ws_1', 'tasks', 'task_local')).toBeUndefined();
    expect(sam.syncState.getState().outbox).toEqual([]);

    await sam.link.leave();
    expect(sam.titles()).toEqual(['Sam local idea']);
  });

  it('leaving deletes the synced copy from the phone and brings the local wedding back', async () => {
    const server = makeServer();
    const phone = await makePhone(server);
    phone.addTask('task_1', 'Local');
    await phone.link.uploadThisWedding('W');
    phone.addTask('task_2', 'Only in the workspace');
    await phone.engine.syncNow();
    await settle();

    expect(phone.link.isLinked()).toBe(true);
    expect(await phone.link.leave()).toBe(true);
    expect(phone.workspaces.getActive()).toBe(LOCAL_WORKSPACE);
    expect(phone.titles()).toEqual(['Local']);
    expect(await phone.storage.get('ws:ws_1:planning:store')).toBeNull();
    // The server still has everything - only this phone's copy went.
    expect(server.record('ws_1', 'tasks', 'task_2')).toBeDefined();
    expect(await phone.link.leave()).toBe(false);
  });

  it('never deletes server records when switching or leaving', async () => {
    const server = makeServer();
    const phone = await makePhone(server);
    phone.addTask('task_1');
    phone.addTask('task_2');
    await phone.link.uploadThisWedding('W');
    await phone.link.leave();
    await phone.link.openAccountWorkspace({ id: 'ws_1' });
    await phone.engine.syncNow();

    expect(server.record('ws_1', 'tasks', 'task_1').deletedAt).toBeNull();
    expect(server.record('ws_1', 'tasks', 'task_2').deletedAt).toBeNull();
    expect(phone.titles()).toEqual(['task_1', 'task_2']);
  });

  it('counts changes that would be lost on leaving', async () => {
    const server = makeServer();
    const phone = await makePhone(server);
    expect(phone.link.pendingChanges()).toBe(0);
    await phone.link.uploadThisWedding('W');
    server.failNext(new Error('offline'));
    phone.addTask('task_unsent');
    expect(phone.link.pendingChanges()).toBe(1);
  });

  it('records why the phone left, for the account screen', async () => {
    const server = makeServer();
    const phone = await makePhone(server);
    await phone.link.uploadThisWedding('W');
    await phone.link.leave({ reason: 'gone' });
    expect(phone.syncState.getState().lastError).toBe('gone');
  });
});
