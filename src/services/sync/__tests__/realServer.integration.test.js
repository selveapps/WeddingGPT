/**
 * @jest-environment node
 */
import { Buffer } from 'buffer';
import http from 'http';
import { create } from 'zustand';

import { createSyncClient } from '../syncClient';
import { createSyncEngine } from '../syncEngine';
import { SliceKind } from '../changes';
import { createSyncStore } from '../../../store/syncStore';
import { applyPendingResponses } from '../../../features/rsvp/applyResponses';
import { templatePackingItems } from '../../../models/packing';
import { createAuthClient } from '../../auth/authClient';

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
    // Node sends no body on a DELETE without a length, so always give one.
    const sized = body ? { ...headers, 'Content-Length': Buffer.byteLength(body) } : headers;
    const request = http.request(url, { method, headers: sized }, (response) => {
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
          text: async () => text,
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

  it('the website written on the phone appears at the public address once published (E2)', async () => {
    const response = await nodeFetch(`${URL_}/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `10.6.${Date.now() % 250}.1` },
      body: JSON.stringify({ email: `site-${Date.now()}@example.com`, password: 'integration-pass' }),
    });
    const couple = await response.json();
    const wedding = await client.createWorkspace(couple.token, 'Site wedding');
    const slug = `site-${Date.now()}`;
    await client.saveRsvpSettings(couple.token, wedding.id, { slug });

    const website = create(() => ({
      website: {
        id: 'site_1',
        welcome: { title: 'Join us in Austin', body: 'Details below.' },
        events: [{ id: 'e1', name: 'Ceremony', place: 'Rose Garden' }],
        registry: [{ id: 'r1', name: 'Our registry', url: 'https://registry.example' }],
        faq: [],
        stays: [],
        travel: '',
      },
    }));
    const engine = createSyncEngine({
      client,
      syncStore: createSyncStore({ persisted: false }),
      slices: [{ collection: 'website', store: website, key: 'website', kind: SliceKind.ONE }],
      getSession: () => ({ token: couple.token, workspaceId: wedding.id }),
      setTimer: () => 0,
      clearTimer: () => {},
    });
    engine.attach();
    engine.seedAll();
    await engine.syncNow();

    expect((await nodeFetch(`${URL_}/w/${slug}`)).status).toBe(404);
    await client.saveSiteSettings(couple.token, wedding.id, { visibility: 'public' });
    const page = await nodeFetch(`${URL_}/w/${slug}`);
    expect(page.status).toBe(200);
    const body = await page.text();
    for (const text of ['Join us in Austin', 'Ceremony', 'Rose Garden', 'Our registry', `/w/${slug}/rsvp`]) {
      expect(body).toContain(text);
    }
  });

  it('seating tables and keep-apart rules sync between phones (D)', async () => {
    const seatingPhone = () => {
      const seating = create(() => ({ tables: { byId: {}, allIds: [] }, rules: null }));
      const syncStore = createSyncStore({ persisted: false });
      const engine = createSyncEngine({
        client,
        syncStore,
        slices: [
          { collection: 'seatingTables', store: seating, key: 'tables', kind: SliceKind.MANY },
          { collection: 'seatingRules', store: seating, key: 'rules', kind: SliceKind.ONE },
        ],
        getSession: () => ({ token, workspaceId }),
        setTimer: () => 0,
        clearTimer: () => {},
      });
      engine.attach();
      return { seating, syncStore, engine };
    };
    const a = seatingPhone();
    const b = seatingPhone();
    a.seating.setState({
      tables: {
        byId: { table_1: { id: 'table_1', name: 'Family', capacity: 8, guestIds: ['g1'] } },
        allIds: ['table_1'],
      },
      rules: { id: 'seatrules_1', avoidPairs: [['g1', 'g2']] },
    });
    await a.engine.syncNow();
    expect(a.syncStore.getState().rejected).toEqual([]);
    await b.engine.syncNow();
    expect(b.seating.getState().tables.byId.table_1.guestIds).toEqual(['g1']);
    expect(b.seating.getState().rules.avoidPairs).toEqual([['g1', 'g2']]);
  });

  it('events, and the tasks, task order and costs that belong to them, sync between phones (C1, C2)', async () => {
    const planningPhone = () => {
      const wedding = create(() => ({
        events: { byId: {}, allIds: [] },
        tasks: { byId: {}, allIds: [] },
        expenses: { byId: {}, allIds: [] },
      }));
      const syncStore = createSyncStore({ persisted: false });
      const engine = createSyncEngine({
        client,
        syncStore,
        slices: [
          { collection: 'events', store: wedding, key: 'events', kind: SliceKind.MANY },
          { collection: 'tasks', store: wedding, key: 'tasks', kind: SliceKind.MANY },
          { collection: 'expenses', store: wedding, key: 'expenses', kind: SliceKind.MANY },
        ],
        getSession: () => ({ token, workspaceId }),
        setTimer: () => 0,
        clearTimer: () => {},
      });
      engine.attach();
      return { wedding, syncStore, engine };
    };
    const a = planningPhone();
    const b = planningPhone();
    const mehndi = {
      id: 'event_1',
      name: 'Mehndi',
      kind: 'mehndi',
      date: '2027-05-07',
      startTime: '18:00',
      guestScope: 'invited',
      invitedGuestIds: ['g1', 'g2'],
      updatedAt: '2027-01-01T00:00:00.000Z',
    };
    a.wedding.setState({
      events: { byId: { event_1: mehndi }, allIds: ['event_1'] },
      tasks: {
        byId: {
          task_1: { id: 'task_1', title: 'Book henna', eventId: 'event_1' },
          task_2: { id: 'task_2', title: 'Confirm henna design', waitsFor: ['task_1'] },
        },
        allIds: ['task_1', 'task_2'],
      },
      expenses: {
        byId: { exp_1: { id: 'exp_1', title: 'Henna artist', amount: 300, eventId: 'event_1' } },
        allIds: ['exp_1'],
      },
    });
    await a.engine.syncNow();
    expect(a.syncStore.getState().rejected).toEqual([]);
    await b.engine.syncNow();
    expect(b.wedding.getState().events.byId.event_1).toMatchObject({
      name: 'Mehndi',
      invitedGuestIds: ['g1', 'g2'],
    });
    expect(b.wedding.getState().tasks.byId.task_1.eventId).toBe('event_1');
    expect(b.wedding.getState().tasks.byId.task_2.waitsFor).toEqual(['task_1']);
    expect(b.wedding.getState().expenses.byId.exp_1.eventId).toBe('event_1');

    // Phone B deletes the event and unassigns its task; phone A follows.
    b.wedding.setState((state) => ({
      events: { byId: {}, allIds: [] },
      tasks: {
        ...state.tasks,
        byId: {
          ...state.tasks.byId,
          task_1: { ...state.tasks.byId.task_1, eventId: null, updatedAt: '2027-01-02T00:00:00.000Z' },
        },
      },
    }));
    await b.engine.syncNow();
    await a.engine.syncNow();
    expect(a.wedding.getState().events.allIds).toEqual([]);
    expect(a.wedding.getState().tasks.byId.task_1.eventId).toBeNull();
  });

  it('a gift logged on one phone is thanked on the other (gifts)', async () => {
    const giftPhone = () => {
      const gifts = create(() => ({ gifts: { byId: {}, allIds: [] } }));
      const syncStore = createSyncStore({ persisted: false });
      const engine = createSyncEngine({
        client,
        syncStore,
        slices: [{ collection: 'gifts', store: gifts, key: 'gifts', kind: SliceKind.MANY }],
        getSession: () => ({ token, workspaceId }),
        setTimer: () => 0,
        clearTimer: () => {},
      });
      engine.attach();
      return { gifts, syncStore, engine };
    };
    const a = giftPhone();
    const b = giftPhone();
    const gift = {
      id: 'gift_1',
      fromName: 'Maria',
      kind: 'item',
      description: 'vase',
      thankYouStatus: 'todo',
      updatedAt: '2027-01-01T00:00:00.000Z',
    };
    a.gifts.setState({ gifts: { byId: { gift_1: gift }, allIds: ['gift_1'] } });
    await a.engine.syncNow();
    expect(a.syncStore.getState().rejected).toEqual([]);
    await b.engine.syncNow();
    expect(b.gifts.getState().gifts.byId.gift_1.fromName).toBe('Maria');

    b.gifts.setState((state) => ({
      gifts: {
        ...state.gifts,
        byId: {
          gift_1: {
            ...state.gifts.byId.gift_1,
            thankYouStatus: 'sent',
            updatedAt: '2027-01-02T00:00:00.000Z',
          },
        },
      },
    }));
    await b.engine.syncNow();
    await a.engine.syncNow();
    expect(a.gifts.getState().gifts.byId.gift_1.thankYouStatus).toBe('sent');
  });

  it('a wedding party job ticked on one phone shows on the other (party)', async () => {
    const partyPhone = () => {
      const party = create(() => ({ members: { byId: {}, allIds: [] } }));
      const syncStore = createSyncStore({ persisted: false });
      const engine = createSyncEngine({
        client,
        syncStore,
        slices: [{ collection: 'partyMembers', store: party, key: 'members', kind: SliceKind.MANY }],
        getSession: () => ({ token, workspaceId }),
        setTimer: () => 0,
        clearTimer: () => {},
      });
      engine.attach();
      return { party, syncStore, engine };
    };
    const a = partyPhone();
    const b = partyPhone();
    const member = {
      id: 'party_1',
      name: 'Meera',
      roleKey: 'maid_of_honor',
      todos: [{ id: 'todo_1', title: 'Plan the shower', done: false }],
      updatedAt: '2027-01-01T00:00:00.000Z',
    };
    a.party.setState({ members: { byId: { party_1: member }, allIds: ['party_1'] } });
    await a.engine.syncNow();
    expect(a.syncStore.getState().rejected).toEqual([]);
    await b.engine.syncNow();
    expect(b.party.getState().members.byId.party_1.name).toBe('Meera');

    b.party.setState((state) => ({
      members: {
        ...state.members,
        byId: {
          party_1: {
            ...state.members.byId.party_1,
            todos: [{ id: 'todo_1', title: 'Plan the shower', done: true }],
            updatedAt: '2027-01-02T00:00:00.000Z',
          },
        },
      },
    }));
    await b.engine.syncNow();
    await a.engine.syncNow();
    expect(a.party.getState().members.byId.party_1.todos[0].done).toBe(true);
  });

  it('pushing the run of show back on one phone moves it on the other (run of show)', async () => {
    const phone = () => {
      const show = create(() => ({ items: { byId: {}, allIds: [] } }));
      const syncStore = createSyncStore({ persisted: false });
      const engine = createSyncEngine({
        client,
        syncStore,
        slices: [{ collection: 'runOfShow', store: show, key: 'items', kind: SliceKind.MANY }],
        getSession: () => ({ token, workspaceId }),
        setTimer: () => 0,
        clearTimer: () => {},
      });
      engine.attach();
      return { show, syncStore, engine };
    };
    const a = phone();
    const b = phone();
    const dinner = {
      id: 'ros_1',
      title: 'Dinner',
      start: 1080,
      durationMin: 90,
      eventId: null,
      updatedAt: '2027-01-01T00:00:00.000Z',
    };
    a.show.setState({ items: { byId: { ros_1: dinner }, allIds: ['ros_1'] } });
    await a.engine.syncNow();
    expect(a.syncStore.getState().rejected).toEqual([]);
    await b.engine.syncNow();
    expect(b.show.getState().items.byId.ros_1.start).toBe(1080);

    b.show.setState((state) => ({
      items: {
        ...state.items,
        byId: { ros_1: { ...dinner, start: 1100, updatedAt: '2027-01-02T00:00:00.000Z' } },
      },
    }));
    await b.engine.syncNow();
    await a.engine.syncNow();
    expect(a.show.getState().items.byId.ros_1.start).toBe(1100);
  });

  it('two phones starting the same packing list end up with one copy (packing)', async () => {
    const phone = () => {
      const packing = create(() => ({ items: { byId: {}, allIds: [] } }));
      const syncStore = createSyncStore({ persisted: false });
      const engine = createSyncEngine({
        client,
        syncStore,
        slices: [{ collection: 'packingItems', store: packing, key: 'items', kind: SliceKind.MANY }],
        getSession: () => ({ token, workspaceId }),
        setTimer: () => 0,
        clearTimer: () => {},
      });
      engine.attach();
      return { packing, syncStore, engine };
    };
    const asCollection = (items) => ({
      byId: Object.fromEntries(items.map((item) => [item.id, item])),
      allIds: items.map((item) => item.id),
    });
    const a = phone();
    const b = phone();
    // Both start the list before either has synced.
    const fromA = templatePackingItems('honeymoon', 'w1');
    a.packing.setState({ items: asCollection(fromA) });
    b.packing.setState({ items: asCollection(templatePackingItems('honeymoon', 'w1')) });
    await a.engine.syncNow();
    await b.engine.syncNow();
    await a.engine.syncNow();
    expect(a.syncStore.getState().rejected).toEqual([]);
    expect(b.syncStore.getState().rejected).toEqual([]);
    expect(a.packing.getState().items.allIds).toHaveLength(fromA.length);
    expect(b.packing.getState().items.allIds).toHaveLength(fromA.length);
  });

  it('exports an account and deletes it for good, with its solo wedding (A7)', async () => {
    // Its own address, so the earlier scenarios' sign-ups do not use up its rate limit.
    const fromOwnIp = (url, init = {}) =>
      nodeFetch(url, {
        ...init,
        headers: { ...init.headers, 'X-Forwarded-For': `10.7.${Date.now() % 250}.7` },
      });
    const auth = createAuthClient({ url: URL_, fetchImpl: fromOwnIp });
    const email = `delete-me-${Date.now()}@example.com`;
    const session = await auth.register({ name: 'Delete me', email, password: 'delete-me-pass' });
    const solo = await client.createWorkspace(session.token, 'Short-lived wedding');
    await client.push(session.token, solo.id, [
      {
        mutationId: `mut_a7_${Date.now()}`,
        collection: 'guests',
        id: 'guest_a7',
        op: 'upsert',
        baseVersion: 0,
        data: { firstName: 'Ana' },
      },
    ]);

    const exported = await auth.exportAccount(session.token);
    expect(exported.user.email).toBe(email);
    expect(exported.workspaces[0].records.map((r) => r.data.firstName)).toEqual(['Ana']);
    expect(JSON.stringify(exported)).not.toMatch(/password|token_hash/);

    await expect(auth.deleteAccount(session.token, 'wrong password')).rejects.toMatchObject({
      code: 'invalid_credentials',
    });
    await expect(auth.me(session.token)).resolves.toMatchObject({ email });

    await auth.deleteAccount(session.token, 'delete-me-pass');
    await expect(auth.me(session.token)).rejects.toMatchObject({ code: 'unauthorised' });
    await expect(auth.login({ email, password: 'delete-me-pass' })).rejects.toMatchObject({
      code: 'invalid_credentials',
    });
  });

  it('a guest answers each event and the couple’s event counts follow (F1)', async () => {
    const response = await nodeFetch(`${URL_}/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `10.6.${Date.now() % 250}.1` },
      body: JSON.stringify({
        name: 'multi',
        email: `multi-${Date.now()}@example.com`,
        password: 'integration-pass',
      }),
    });
    const couple = await response.json();
    const wedding = await client.createWorkspace(couple.token, 'Several events');

    const collection = (records) => ({
      byId: Object.fromEntries(records.map((r) => [r.id, r])),
      allIds: records.map((r) => r.id),
    });
    const patchable = (key) => (set, get) => (id, patch) =>
      set({
        [key]: { ...get()[key], byId: { ...get()[key].byId, [id]: { ...get()[key].byId[id], ...patch } } },
      });
    const guests = create((set, get) => ({
      guests: collection([{ id: 'g_nina', firstName: 'Nina', rsvpStatus: 'pending' }]),
      updateGuest: patchable('guests')(set, get),
    }));
    const events = create((set, get) => ({
      events: collection([
        { id: 'ev_mehndi', name: 'Mehndi', date: '2027-05-07', guestScope: 'everyone' },
        { id: 'ev_reception', name: 'Reception', date: '2027-05-08', guestScope: 'everyone' },
      ]),
      applyAttendance: (byEvent) => {
        for (const [id, answers] of Object.entries(byEvent)) {
          const event = get().events.byId[id];
          if (event)
            patchable('events')(set, get)(id, { attendance: { ...(event.attendance ?? {}), ...answers } });
        }
      },
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
        { collection: 'events', store: events, key: 'events', kind: SliceKind.MANY },
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
      { type: 'guest', id: 'g_nina' },
    ]);
    const path = new URL(invite.url).pathname;
    const form = await (await nodeFetch(`${URL_}${path}`)).text();
    expect(form).toContain('name="event_g_nina_ev_mehndi"');
    const sent = await nodeFetch(`${URL_}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        submit: '1',
        event_g_nina_ev_mehndi: 'yes',
        event_g_nina_ev_reception: 'no',
      }).toString(),
    });
    expect(sent.status).toBe(200);

    await engine.syncNow();
    applyPendingResponses({ rsvpStore: replies, guestStore: guests, eventStore: events });
    expect(events.getState().events.byId.ev_mehndi.attendance).toEqual({ g_nina: 'attending' });
    expect(events.getState().events.byId.ev_reception.attendance).toEqual({ g_nina: 'declined' });
    expect(guests.getState().guests.byId.g_nina.rsvpStatus).toBe('attending');

    // The couple's phone pushes the event changes; the server never wrote them.
    await engine.syncNow();
    expect(syncStore.getState().rejected).toEqual([]);
    expect(syncStore.getState().outbox).toEqual([]);
  });

  it('a vendor opens a day-of sheet, and it stops working when turned off (F3)', async () => {
    const response = await nodeFetch(`${URL_}/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `10.5.${Date.now() % 250}.3` },
      body: JSON.stringify({
        name: 'sheets',
        email: `sheets-${Date.now()}@example.com`,
        password: 'integration-pass',
      }),
    });
    const couple = await response.json();
    // Its own address, so earlier scenarios do not use up the per-address rate limits.
    const own = createSyncClient({
      url: URL_,
      fetchImpl: (target, init = {}) =>
        nodeFetch(target, {
          ...init,
          headers: { ...init.headers, 'X-Forwarded-For': `10.5.${Date.now() % 250}.9` },
        }),
    });
    const wedding = await own.createWorkspace(couple.token, 'Day sheets');
    await own.push(couple.token, wedding.id, [
      {
        mutationId: `mut_f3a_${Date.now()}`,
        collection: 'events',
        id: 'ev_1',
        op: 'upsert',
        baseVersion: 0,
        data: { id: 'ev_1', name: 'Reception', venueName: 'The Hall' },
      },
      {
        mutationId: `mut_f3b_${Date.now()}`,
        collection: 'runOfShow',
        id: 'ros_1',
        op: 'upsert',
        baseVersion: 0,
        data: { id: 'ros_1', eventId: 'ev_1', title: 'First dance', start: 1200, durationMin: 10 },
      },
      {
        mutationId: `mut_f3c_${Date.now()}`,
        collection: 'guests',
        id: 'g_1',
        op: 'upsert',
        baseVersion: 0,
        data: { id: 'g_1', firstName: 'Secret guest' },
      },
    ]);

    const { sheet, url } = await own.createDaySheet(couple.token, wedding.id, {
      eventId: 'ev_1',
      label: 'DJ Sam',
    });
    const page = await nodeFetch(`${URL_}${new URL(url).pathname}`);
    expect(page.status).toBe(200);
    const body = await page.text();
    expect(body).toContain('Day-of sheet for DJ Sam');
    expect(body).toContain('First dance');
    expect(body).not.toContain('Secret guest');

    const [listed] = await own.listDaySheets(couple.token, wedding.id);
    expect(listed.lastOpenedAt).toBeTruthy();
    await own.revokeDaySheet(couple.token, wedding.id, sheet.id);
    expect((await nodeFetch(`${URL_}${new URL(url).pathname}`)).status).toBe(404);
  });
});
