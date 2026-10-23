import { applyPendingResponses, planResponseUpdates, watchRsvpResponses } from '../applyResponses';
import { MealPreference, PlusOneStatus, RsvpStatus, createGuest, eventGuestSummary } from '@/models';
import { useEventStore, useGuestStore, useRsvpStore, createSyncStore } from '@/store';
import { createSyncEngine } from '@/services/sync/syncEngine';
import { SliceKind } from '@/services/sync/changes';
import { createFakeSyncServer } from '@/test/fakeSyncServer';

const response = (id, submittedAt, guests, extra = {}) => ({
  id,
  submittedAt,
  guests,
  message: '',
  ...extra,
});
const answer = (guestId, attending, extra = {}) => ({
  guestId,
  attending,
  meal: null,
  dietary: '',
  plusOneName: '',
  ...extra,
});

describe('planResponseUpdates', () => {
  const guestsById = { g1: { id: 'g1' }, g2: { id: 'g2' } };

  it('turns answers into guest updates', () => {
    const plan = planResponseUpdates({
      responses: [
        response('r1', '2027-03-01T10:00:00.000Z', [
          answer('g1', true, { meal: MealPreference.VEGAN, dietary: 'no nuts', plusOneName: 'Anika' }),
          answer('g2', false, { meal: MealPreference.VEGAN }),
        ]),
      ],
      guestsById,
    });
    expect(plan.updates).toEqual([
      {
        guestId: 'g1',
        patch: {
          rsvpStatus: RsvpStatus.ATTENDING,
          rsvpRespondedAt: '2027-03-01T10:00:00.000Z',
          mealPreference: MealPreference.VEGAN,
          dietaryNotes: 'no nuts',
          plusOneName: 'Anika',
          plusOneStatus: PlusOneStatus.CONFIRMED,
        },
      },
      // A guest who declines keeps their meal and plus-one as the couple set them.
      {
        guestId: 'g2',
        patch: { rsvpStatus: RsvpStatus.DECLINED, rsvpRespondedAt: '2027-03-01T10:00:00.000Z' },
      },
    ]);
    expect(plan.applied).toEqual([{ id: 'r1', submittedAt: '2027-03-01T10:00:00.000Z' }]);
  });

  it('applies each submission once, and again only when the guest resubmits', () => {
    const r1 = response('r1', '2027-03-01T10:00:00.000Z', [answer('g1', true)]);
    expect(
      planResponseUpdates({ responses: [r1], applied: { r1: r1.submittedAt }, guestsById }).updates
    ).toEqual([]);
    const resubmitted = { ...r1, submittedAt: '2027-03-02T10:00:00.000Z', guests: [answer('g1', false)] };
    const plan = planResponseUpdates({
      responses: [resubmitted],
      applied: { r1: r1.submittedAt },
      guestsById,
    });
    expect(plan.updates[0].patch.rsvpStatus).toBe(RsvpStatus.DECLINED);
  });

  it('lets the newest reply win when two cover the same guest', () => {
    const plan = planResponseUpdates({
      responses: [
        response('r_new', '2027-03-05T00:00:00.000Z', [answer('g1', false)]),
        response('r_old', '2027-03-01T00:00:00.000Z', [answer('g1', true)]),
      ],
      guestsById,
    });
    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].patch.rsvpStatus).toBe(RsvpStatus.DECLINED);
  });

  it('skips guests the couple has since deleted', () => {
    const plan = planResponseUpdates({
      responses: [response('r1', '2027-03-01T00:00:00.000Z', [answer('gone', true)])],
      guestsById,
    });
    expect(plan.updates).toEqual([]);
    expect(plan.applied).toHaveLength(1);
  });
});

describe('watchRsvpResponses with the sync engine', () => {
  const WS = 'ws_1';

  beforeEach(() => {
    useGuestStore.getState().reset();
    useRsvpStore.getState().reset();
  });

  function setup({ defer } = {}) {
    const server = createFakeSyncServer();
    const syncStore = createSyncStore({ persisted: false });
    const engine = createSyncEngine({
      client: server.client,
      syncStore,
      slices: [
        { collection: 'guests', store: useGuestStore, key: 'guests', kind: SliceKind.MANY },
        {
          collection: 'rsvpResponses',
          store: useRsvpStore,
          key: 'responses',
          kind: SliceKind.MANY,
          readOnly: true,
        },
      ],
      getSession: () => ({ token: 'tok', workspaceId: WS }),
      setTimer: () => 0,
      clearTimer: () => {},
    });
    return {
      server,
      syncStore,
      engine,
      unwatch: watchRsvpResponses({ rsvpStore: useRsvpStore, guestStore: useGuestStore, defer }),
    };
  }

  it('applies a reply that arrives in a pull, and queues the guest edit for the partner', async () => {
    const guest = useGuestStore.getState().addGuest(createGuest({ weddingId: 'w', firstName: 'Meera' }));
    const { server, syncStore, engine, unwatch } = setup({ defer: (fn) => Promise.resolve().then(fn) });
    engine.attach();
    await engine.seedAll();
    await engine.syncNow();

    // The guest replies on the website; the server writes the record.
    await server.client.push('server', WS, [
      {
        mutationId: 'mut_rsvp_1',
        collection: 'rsvpResponses',
        id: 'rsvp_inv1',
        op: 'upsert',
        baseVersion: 0,
        data: response('rsvp_inv1', '2027-03-01T10:00:00.000Z', [answer(guest.id, true, { meal: 'vegan' })]),
      },
    ]);

    await engine.syncNow();
    await Promise.resolve();
    await Promise.resolve();

    const updated = useGuestStore.getState().guests.byId[guest.id];
    expect(updated.rsvpStatus).toBe(RsvpStatus.ATTENDING);
    expect(updated.mealPreference).toBe('vegan');
    expect(syncStore.getState().outbox.map((m) => [m.collection, m.id])).toEqual([['guests', guest.id]]);
    // The reply itself is never pushed back.
    expect(syncStore.getState().outbox.some((m) => m.collection === 'rsvpResponses')).toBe(false);
    unwatch();
  });

  it('applies replies already on the phone when it starts watching', () => {
    const guest = useGuestStore.getState().addGuest(createGuest({ weddingId: 'w', firstName: 'Jo' }));
    useRsvpStore.setState({
      responses: {
        byId: { r1: response('r1', '2027-03-01T10:00:00.000Z', [answer(guest.id, false)]) },
        allIds: ['r1'],
      },
    });
    const unwatch = watchRsvpResponses({ rsvpStore: useRsvpStore, guestStore: useGuestStore });
    expect(useGuestStore.getState().guests.byId[guest.id].rsvpStatus).toBe(RsvpStatus.DECLINED);
    expect(useRsvpStore.getState().applied).toEqual({ r1: '2027-03-01T10:00:00.000Z' });
    unwatch();
  });
});

describe('per-event replies (F1)', () => {
  const reply = (submittedAt, guests) => ({ id: 'rsvp_inv_1', inviteId: 'inv_1', submittedAt, guests });

  it('plans attendance for each event answered', () => {
    const guestsById = { g_nina: { id: 'g_nina' }, g_omar: { id: 'g_omar' } };
    const plan = planResponseUpdates({
      responses: [
        reply('2027-02-01T10:00:00Z', [
          { guestId: 'g_nina', attending: true, events: { ev_mehndi: true, ev_reception: false } },
          { guestId: 'g_omar', attending: false },
          { guestId: 'g_gone', attending: true, events: { ev_mehndi: true } },
        ]),
      ],
      guestsById,
    });
    expect(plan.attendance).toEqual({
      ev_mehndi: { g_nina: 'attending' },
      ev_reception: { g_nina: 'declined' },
    });
    expect(plan.updates.find((u) => u.guestId === 'g_nina').patch.rsvpStatus).toBe(RsvpStatus.ATTENDING);
  });

  it('updates each event’s counts, and only events that still exist', () => {
    useGuestStore.getState().reset();
    useEventStore.getState().reset();
    useRsvpStore.getState().reset();
    const nina = useGuestStore.getState().addGuest(createGuest({ firstName: 'Nina' }));
    const mehndi = useEventStore.getState().addEvent({ kind: 'mehndi' });
    const reception = useEventStore.getState().addEvent({ kind: 'reception' });
    useRsvpStore.setState({
      responses: {
        byId: {
          rsvp_inv_1: reply('2027-02-01T10:00:00Z', [
            {
              guestId: nina.id,
              attending: true,
              events: { [mehndi.id]: true, [reception.id]: false, ev_deleted: true },
            },
          ]),
        },
        allIds: ['rsvp_inv_1'],
      },
    });

    applyPendingResponses({ rsvpStore: useRsvpStore, guestStore: useGuestStore, eventStore: useEventStore });
    const events = useEventStore.getState().events.byId;
    const guests = Object.values(useGuestStore.getState().guests.byId);
    // Wedding-wide she is attending; the reception count still says declined.
    expect(eventGuestSummary(events[mehndi.id], guests)).toMatchObject({ attending: 1, declined: 0 });
    expect(eventGuestSummary(events[reception.id], guests)).toMatchObject({ attending: 0, declined: 1 });
    expect(events.ev_deleted).toBeUndefined();

    // Applied once: a second run changes nothing.
    const before = useEventStore.getState().events;
    applyPendingResponses({ rsvpStore: useRsvpStore, guestStore: useGuestStore, eventStore: useEventStore });
    expect(useEventStore.getState().events).toBe(before);
  });
});
