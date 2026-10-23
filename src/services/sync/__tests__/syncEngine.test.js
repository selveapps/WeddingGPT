import { create } from 'zustand';

import { createSyncEngine } from '../syncEngine';
import { SliceKind } from '../changes';
import { SyncError, SyncErrorCode } from '../syncClient';
import { createSyncStore } from '../../../store/syncStore';
import { createFakeSyncServer } from '../../../test/fakeSyncServer';

const WS = 'ws_1';

/** A small "phone": its own stores, sync state and engine, sharing a server. */
function makePhone(server, { token = 'tok', active = true, debounceMs = 0, ...overrides } = {}) {
  const tasks = create(() => ({ tasks: { byId: {}, allIds: [] } }));
  const wedding = create(() => ({ wedding: null }));
  const syncStore = createSyncStore({ persisted: false });
  let session = active ? { token, workspaceId: WS } : null;
  const timers = [];

  const engine = createSyncEngine({
    client: server.client,
    syncStore,
    slices: [
      { collection: 'tasks', store: tasks, key: 'tasks', kind: SliceKind.MANY },
      { collection: 'wedding', store: wedding, key: 'wedding', kind: SliceKind.ONE },
    ],
    getSession: () => session,
    debounceMs,
    setTimer: (fn) => {
      timers.push(fn);
      return timers.length;
    },
    clearTimer: () => {},
    ...overrides,
  });

  const addTask = (id, fields = {}) =>
    tasks.setState((state) => ({
      tasks: {
        byId: { ...state.tasks.byId, [id]: { id, title: id, ...fields } },
        allIds: state.tasks.allIds.includes(id) ? state.tasks.allIds : [...state.tasks.allIds, id],
      },
    }));
  const editTask = (id, fields) =>
    tasks.setState((state) => ({
      tasks: { ...state.tasks, byId: { ...state.tasks.byId, [id]: { ...state.tasks.byId[id], ...fields } } },
    }));
  const removeTask = (id) =>
    tasks.setState((state) => {
      const byId = { ...state.tasks.byId };
      delete byId[id];
      return { tasks: { byId, allIds: state.tasks.allIds.filter((x) => x !== id) } };
    });

  return {
    tasks,
    wedding,
    syncStore,
    engine,
    timers,
    addTask,
    editTask,
    removeTask,
    titles: () => tasks.getState().tasks.allIds.map((id) => tasks.getState().tasks.byId[id].title),
    outbox: () => syncStore.getState().outbox,
    signOut: () => {
      session = null;
    },
  };
}

describe('sync engine', () => {
  it('queues a local edit and pushes it', async () => {
    const server = createFakeSyncServer();
    const phone = makePhone(server);
    phone.engine.attach();

    phone.addTask('task_1', { title: 'Book venue' });
    expect(phone.outbox()).toHaveLength(1);
    expect(phone.timers).toHaveLength(1);

    await phone.engine.syncNow();
    expect(phone.outbox()).toEqual([]);
    expect(server.record(WS, 'tasks', 'task_1')).toMatchObject({ version: 1, data: { title: 'Book venue' } });
    expect(phone.syncStore.getState().lastSyncedAt).toEqual(expect.any(String));
  });

  it("brings one phone's changes to the other, without echoing them back", async () => {
    const server = createFakeSyncServer();
    const priya = makePhone(server, { token: 'priya' });
    const sam = makePhone(server, { token: 'sam' });
    priya.engine.attach();
    sam.engine.attach();

    priya.addTask('task_1', { title: 'Book venue' });
    priya.wedding.setState({ wedding: { id: 'wed_1', city: 'Austin' } });
    await priya.engine.syncNow();
    await sam.engine.syncNow();

    expect(sam.titles()).toEqual(['Book venue']);
    expect(sam.wedding.getState().wedding).toEqual({ id: 'wed_1', city: 'Austin' });
    expect(sam.outbox()).toEqual([]);
    const pushesBefore = server.calls.push;
    await sam.engine.syncNow();
    expect(server.calls.push).toBe(pushesBefore);
  });

  it('syncs deletes', async () => {
    const server = createFakeSyncServer();
    const priya = makePhone(server);
    const sam = makePhone(server);
    priya.engine.attach();
    sam.engine.attach();

    priya.addTask('task_1');
    await priya.engine.syncNow();
    await sam.engine.syncNow();
    sam.removeTask('task_1');
    await sam.engine.syncNow();
    await priya.engine.syncNow();

    expect(priya.titles()).toEqual([]);
    expect(server.record(WS, 'tasks', 'task_1')).toMatchObject({ deletedAt: expect.any(String), data: null });
  });

  it('reports a conflicting edit and can restore the overwritten version', async () => {
    const server = createFakeSyncServer();
    const priya = makePhone(server, { token: 'priya' });
    const sam = makePhone(server, { token: 'sam' });
    priya.engine.attach();
    sam.engine.attach();

    priya.addTask('task_1', { title: 'Book venue' });
    await priya.engine.syncNow();
    await sam.engine.syncNow();

    // Both edit offline from version 1.
    priya.editTask('task_1', { title: 'Book the barn' });
    sam.editTask('task_1', { title: 'Book the garden' });
    await priya.engine.syncNow();
    await sam.engine.syncNow();

    const [conflict] = sam.syncStore.getState().conflicts;
    expect(conflict).toMatchObject({ collection: 'tasks', recordId: 'task_1' });
    expect(conflict.overwritten.data.title).toBe('Book the barn');
    expect(sam.titles()).toEqual(['Book the garden']);

    expect(sam.engine.restoreConflict(conflict)).toBe(true);
    expect(sam.titles()).toEqual(['Book the barn']);
    expect(sam.syncStore.getState().conflicts).toEqual([]);
    await sam.engine.syncNow();
    await priya.engine.syncNow();
    expect(priya.titles()).toEqual(['Book the barn']);
  });

  it('does not let a pull overwrite a change still waiting to be pushed', async () => {
    const server = createFakeSyncServer();
    const priya = makePhone(server, { token: 'priya' });
    const sam = makePhone(server, { token: 'sam' });
    priya.engine.attach();
    sam.engine.attach();
    priya.addTask('task_1', { title: 'v1' });
    await priya.engine.syncNow();
    await sam.engine.syncNow();

    priya.editTask('task_1', { title: 'from Priya' });
    await priya.engine.syncNow();
    sam.editTask('task_1', { title: 'from Sam, offline' });
    // Sam's push fails; the pull that follows next time must not clobber his edit first.
    server.failNext(new SyncError(SyncErrorCode.OFFLINE));
    await sam.engine.syncNow();
    expect(sam.titles()).toEqual(['from Sam, offline']);
    expect(sam.syncStore.getState().lastError).toBe(SyncErrorCode.OFFLINE);

    await sam.engine.syncNow();
    expect(server.record(WS, 'tasks', 'task_1').data.title).toBe('from Sam, offline');
    expect(sam.syncStore.getState().conflicts).toHaveLength(1);
  });

  it('keeps a local edit made while a pull is in flight', async () => {
    const server = createFakeSyncServer();
    const priya = makePhone(server, { token: 'priya' });
    priya.engine.attach();
    priya.addTask('task_1', { title: 'v1' });
    await priya.engine.syncNow();

    // Sam's pull brings Priya's task; while it is on the way, Sam edits it.
    let sam;
    const pullDuringEdit = {
      ...server.client,
      pull: async (...args) => {
        const page = await server.client.pull(...args);
        if (page.records.length) sam.editTask('task_1', { title: 'Sam, mid-pull' });
        return page;
      },
    };
    sam = makePhone({ ...server, client: pullDuringEdit }, { token: 'sam' });
    sam.engine.attach();
    sam.addTask('task_1', { title: 'Sam draft' });
    await sam.engine.syncNow();

    expect(sam.titles()).toEqual(['Sam, mid-pull']);
    expect(sam.outbox().map((m) => m.id)).toEqual(['task_1']);
  });

  describe('guards against destroying server data', () => {
    it('does not upload what was already there when it attached (launch)', () => {
      const server = createFakeSyncServer();
      const phone = makePhone(server);
      phone.addTask('task_1');
      phone.addTask('task_2');
      phone.engine.attach();
      expect(phone.outbox()).toEqual([]);

      // The next edit queues only the record that changed.
      phone.editTask('task_2', { title: 'edited' });
      expect(phone.outbox().map((m) => m.id)).toEqual(['task_2']);
    });

    it('does not queue deletes when a workspace switch empties the stores', async () => {
      const server = createFakeSyncServer();
      const phone = makePhone(server);
      phone.engine.attach();
      phone.addTask('task_1');
      await phone.engine.syncNow();

      await phone.engine.whilePaused(async () => {
        phone.tasks.setState({ tasks: { byId: {}, allIds: [] } });
        phone.tasks.setState({ tasks: { byId: { task_9: { id: 'task_9' } }, allIds: ['task_9'] } });
      });
      expect(phone.outbox()).toEqual([]);

      // Tracking resumes from the new contents.
      phone.editTask('task_9', { title: 'edited' });
      expect(phone.outbox().map((m) => [m.id, m.op])).toEqual([['task_9', 'upsert']]);
    });

    it('queues nothing while there is no synced workspace', () => {
      const server = createFakeSyncServer();
      const phone = makePhone(server, { active: false });
      phone.engine.attach();
      phone.addTask('task_1');
      expect(phone.outbox()).toEqual([]);
    });
  });

  it('seeds every entity for the first upload of a workspace', async () => {
    const server = createFakeSyncServer();
    const phone = makePhone(server);
    phone.addTask('task_1');
    phone.addTask('task_2');
    phone.wedding.setState({ wedding: { id: 'wed_1' } });
    phone.engine.attach();

    expect(phone.engine.seedAll()).toBe(3);
    await phone.engine.syncNow();
    expect(server.record(WS, 'wedding', 'wed_1')).toBeDefined();
    expect(server.record(WS, 'tasks', 'task_2')).toBeDefined();
  });

  it('pushes large outboxes in batches of 100 and pulls every page', async () => {
    const server = createFakeSyncServer();
    const priya = makePhone(server);
    priya.engine.attach();
    for (let i = 0; i < 250; i += 1) priya.addTask(`task_${i}`);
    await priya.engine.syncNow();
    expect(server.calls.push).toBe(3);

    const sam = makePhone(server);
    sam.engine.attach();
    const pullsBefore = server.calls.pull;
    const pullLimited = {
      ...server.client,
      pull: (t, w, o) => server.client.pull(t, w, { ...o, limit: 100 }),
    };
    const samLimited = makePhone({ ...server, client: pullLimited });
    samLimited.engine.attach();
    await samLimited.engine.syncNow();
    expect(samLimited.titles()).toHaveLength(250);
    expect(server.calls.pull - pullsBefore).toBe(3);
  });

  it('runs one sync at a time and runs again for changes made meanwhile', async () => {
    const server = createFakeSyncServer();
    const phone = makePhone(server);
    phone.engine.attach();
    phone.addTask('task_1');

    const first = phone.engine.syncNow();
    phone.addTask('task_2');
    const second = phone.engine.syncNow();
    await Promise.all([first, second]);

    expect(phone.outbox()).toEqual([]);
    expect(server.record(WS, 'tasks', 'task_2')).toBeDefined();
  });

  it('reports unauthorised and gone workspaces to the app', async () => {
    const server = createFakeSyncServer();
    const onUnauthorised = jest.fn();
    const onGone = jest.fn();
    const phone = makePhone(server, { onUnauthorised, onGone });
    phone.engine.attach();

    server.failNext(new SyncError(SyncErrorCode.UNAUTHORISED));
    expect(await phone.engine.syncNow()).toMatchObject({
      error: SyncErrorCode.UNAUTHORISED,
      retryable: false,
    });
    expect(onUnauthorised).toHaveBeenCalled();

    server.failNext(new SyncError(SyncErrorCode.GONE));
    await phone.engine.syncNow();
    expect(onGone).toHaveBeenCalledWith(WS);
  });

  it('skips syncing without a session', async () => {
    const server = createFakeSyncServer();
    const phone = makePhone(server, { active: false });
    expect(await phone.engine.syncNow()).toEqual({ skipped: true });
    expect(server.calls.pull).toBe(0);
  });

  it('stops watching after detach', () => {
    const server = createFakeSyncServer();
    const phone = makePhone(server);
    phone.engine.attach();
    phone.engine.detach();
    phone.addTask('task_1');
    expect(phone.outbox()).toEqual([]);
  });
});
