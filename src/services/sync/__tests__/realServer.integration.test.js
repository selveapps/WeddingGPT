/**
 * @jest-environment node
 */
import http from 'http';
import { create } from 'zustand';

import { createSyncClient } from '../syncClient';
import { createSyncEngine } from '../syncEngine';
import { SliceKind } from '../changes';
import { createSyncStore } from '../../../store/syncStore';
import { applyPendingResponses } from '../../../features/rsvp/applyResponses';

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

  it('two accounts share one wedding through an invite (A5)', async () => {
    const register = async (name) => {
      const response = await nodeFetch(`${URL_}/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': `10.8.${Date.now() % 250}.${name.length}`,
        },
        body: JSON.stringify({
          name,
          email: `${name}-${Date.now()}@example.com`,
          password: 'integration-pass',
        }),
      });
      return response.json();
    };
    const priya = await register('priya');
    const sam = await register('sam');
    const shared = await client.createWorkspace(priya.token, 'Priya and Sam');

    const { url, token: invite } = await client.createInvite(priya.token, shared.id);
    expect(url).toContain(invite);
    await expect(client.createInvite(sam.token, shared.id)).rejects.toMatchObject({ code: 'gone' });

    const joined = await client.acceptInvite(sam.token, invite);
    expect(joined.workspace).toMatchObject({ id: shared.id, role: 'partner' });
    await expect(client.acceptInvite(sam.token, invite)).rejects.toMatchObject({ code: 'invite_invalid' });

    const members = await client.listMembers(priya.token, shared.id);
    expect(members.map((m) => [m.name, m.role])).toEqual([
      ['priya', 'owner'],
      ['sam', 'partner'],
    ]);

    // Each phone syncs as its own account.
    const phoneFor = (account) => {
      const tasks = create(() => ({ tasks: { byId: {}, allIds: [] } }));
      const engine = createSyncEngine({
        client,
        syncStore: createSyncStore({ persisted: false }),
        slices: [{ collection: 'tasks', store: tasks, key: 'tasks', kind: SliceKind.MANY }],
        getSession: () => ({ token: account.token, workspaceId: shared.id }),
        setTimer: () => 0,
        clearTimer: () => {},
      });
      engine.attach();
      return { tasks, engine };
    };
    const priyaPhone = phoneFor(priya);
    const samPhone = phoneFor(sam);

    priyaPhone.tasks.setState({ tasks: { byId: { t1: { id: 't1', title: 'Book venue' } }, allIds: ['t1'] } });
    await priyaPhone.engine.syncNow();
    await samPhone.engine.syncNow();
    expect(samPhone.tasks.getState().tasks.byId.t1.title).toBe('Book venue');

    samPhone.tasks.setState((st) => ({
      tasks: {
        byId: { ...st.tasks.byId, t2: { id: 't2', title: 'Sam adds the DJ' } },
        allIds: [...st.tasks.allIds, 't2'],
      },
    }));
    await samPhone.engine.syncNow();
    await priyaPhone.engine.syncNow();
    expect(priyaPhone.tasks.getState().tasks.allIds).toEqual(['t1', 't2']);

    // Removed, Sam's next sync finds the wedding gone.
    await client.removeMember(priya.token, shared.id, sam.user.id);
    expect(await samPhone.engine.syncNow()).toMatchObject({ error: 'gone' });
  });

  it('a guest replies on the RSVP site and the couple’s guest list updates (E1)', async () => {
    const response = await nodeFetch(`${URL_}/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `10.7.${Date.now() % 250}.1` },
      body: JSON.stringify({
        name: 'couple',
        email: `couple-${Date.now()}@example.com`,
        password: 'integration-pass',
      }),
    });
    const couple = await response.json();
    const wedding = await client.createWorkspace(couple.token, 'RSVP wedding');

    // The couple's phone: guests plus the read-only replies slice.
    const guests = create((set, get) => ({
      guests: {
        byId: { g_meera: { id: 'g_meera', firstName: 'Meera', householdId: 'h1', rsvpStatus: 'pending' } },
        allIds: ['g_meera'],
      },
      updateGuest: (id, patch) =>
        set({
          guests: {
            ...get().guests,
            byId: { ...get().guests.byId, [id]: { ...get().guests.byId[id], ...patch } },
          },
        }),
    }));
    const replies = create((set, get) => ({
      responses: { byId: {}, allIds: [] },
      applied: {},
      markApplied: (entries) =>
        set({
          applied: { ...get().applied, ...Object.fromEntries(entries.map((e) => [e.id, e.submittedAt])) },
        }),
    }));
    const syncStore = createSyncStore({ persisted: false });
    const engine = createSyncEngine({
      client,
      syncStore,
      slices: [
        { collection: 'guests', store: guests, key: 'guests', kind: SliceKind.MANY },
        {
          collection: 'rsvpResponses',
          store: replies,
          key: 'responses',
          kind: SliceKind.MANY,
          readOnly: true,
        },
      ],
      getSession: () => ({ token: couple.token, workspaceId: wedding.id }),
      setTimer: () => 0,
      clearTimer: () => {},
    });
    engine.attach();
    engine.seedAll();
    await engine.syncNow();

    const [invite] = await client.createRsvpInvites(couple.token, wedding.id, [
      { type: 'household', id: 'h1' },
    ]);
    const path = new URL(invite.url).pathname;

    // The guest opens the link and replies - a plain form post, no app.
    const page = await nodeFetch(`${URL_}${path}`);
    expect(page.status).toBe(200);
    const sent = await nodeFetch(`${URL_}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ submit: '1', attending_g_meera: 'yes', meal_g_meera: 'vegan' }).toString(),
    });
    expect(sent.status).toBe(200);

    await engine.syncNow();
    expect(replies.getState().responses.allIds).toHaveLength(1);
    expect(applyPendingResponses({ rsvpStore: replies, guestStore: guests })).toBe(1);
    expect(guests.getState().guests.byId.g_meera).toMatchObject({
      rsvpStatus: 'attending',
      mealPreference: 'vegan',
    });

    // The guest edit syncs back; the reply itself is never pushed.
    await engine.syncNow();
    expect(syncStore.getState().outbox).toEqual([]);
    expect(syncStore.getState().rejected).toEqual([]);
  });
});
