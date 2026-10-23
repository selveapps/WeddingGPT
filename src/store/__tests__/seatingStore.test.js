import { useSeatingStore, selectSeatingTables, selectAvoidPairs } from '../seatingStore';
import { importLabSeating, LABS_SEATING_KEY } from '../../features/seating/labsImport';
import { RsvpStatus } from '../../models';

const store = () => useSeatingStore.getState();
const tables = () => selectSeatingTables(useSeatingStore.getState());
const guest = (id, householdId = null, rsvpStatus = RsvpStatus.ATTENDING) => ({
  id,
  firstName: id,
  householdId,
  rsvpStatus,
});

beforeEach(() => store().reset());

describe('seatingStore', () => {
  it('adds tables with sensible sizes', () => {
    expect(store().addTable({ weddingId: 'w', name: 'Table 1' }).capacity).toBe(8);
    expect(store().addTable({ name: 'Big', capacity: 500 }).capacity).toBe(40);
    expect(store().addTable({ name: 'Tiny', capacity: 0 }).capacity).toBe(8);
    expect(tables().map((t) => t.name)).toEqual(['Table 1', 'Big', 'Tiny']);
  });

  it('never shrinks a table below the guests already at it', () => {
    const table = store().addTable({ name: 'T', capacity: 4 });
    store().assign(table.id, 'a');
    store().assign(table.id, 'b');
    store().assign(table.id, 'c');
    expect(store().updateTable(table.id, { capacity: 2 }).capacity).toBe(3);
    expect(store().updateTable(table.id, { name: 'Family' }).name).toBe('Family');
  });

  it('writes only the tables whose seating changed', () => {
    const one = store().addTable({ name: 'One' });
    const two = store().addTable({ name: 'Two' });
    const three = store().addTable({ name: 'Three' });
    store().assign(one.id, 'a');
    const before = useSeatingStore.getState().tables.byId;

    store().assign(two.id, 'a');
    const after = useSeatingStore.getState().tables.byId;
    expect(after[one.id]).not.toBe(before[one.id]);
    expect(after[two.id]).not.toBe(before[two.id]);
    expect(after[three.id]).toBe(before[three.id]);
    expect(after[two.id].guestIds).toEqual(['a']);
  });

  it('refuses a full table', () => {
    const table = store().addTable({ name: 'T', capacity: 1 });
    store().assign(table.id, 'a');
    expect(store().assign(table.id, 'b').error).toBe('T is full.');
  });

  it('auto-seats households together and respects keep-apart pairs', () => {
    store().addTable({ name: 'A', capacity: 3 });
    store().addTable({ name: 'B', capacity: 3 });
    store().addAvoidPair('w', 'x', 'y');
    const result = store().autoSeat([
      guest('p1', 'h'),
      guest('p2', 'h'),
      guest('x'),
      guest('y'),
      guest('no', null, RsvpStatus.DECLINED),
    ]);
    expect(result.placed).toBe(4);
    const seatsOf = (id) => tables().find((t) => t.guestIds.includes(id))?.name;
    expect(seatsOf('p1')).toBe(seatsOf('p2'));
    expect(seatsOf('x')).not.toBe(seatsOf('y'));
    expect(seatsOf('no')).toBeUndefined();
  });

  it('frees the seats of deleted guests', () => {
    const table = store().addTable({ name: 'T' });
    store().assign(table.id, 'kept');
    store().assign(table.id, 'deleted');
    expect(store().releaseMissingGuests(['kept'])).toBe(1);
    expect(tables()[0].guestIds).toEqual(['kept']);
    expect(store().releaseMissingGuests(['kept'])).toBe(0);
  });

  it('keeps each keep-apart pair once, in either order', () => {
    expect(store().addAvoidPair('w', 'a', 'b')).toBe(true);
    expect(store().addAvoidPair('w', 'b', 'a')).toBe(false);
    expect(store().addAvoidPair('w', 'a', 'a')).toBe(false);
    expect(selectAvoidPairs(useSeatingStore.getState())).toEqual([['a', 'b']]);
    store().removeAvoidPair(0);
    expect(selectAvoidPairs(useSeatingStore.getState())).toEqual([]);
  });
});

describe('importLabSeating', () => {
  const memory = (data) => {
    const values = { ...data };
    return {
      values,
      getItem: jest.fn(async (key) => values[key] ?? null),
      removeItem: jest.fn(async (key) => {
        delete values[key];
      }),
    };
  };

  it('brings over Labs tables and pairs once, then deletes the Labs data', async () => {
    const storage = memory({
      [LABS_SEATING_KEY]: {
        state: {
          items: {
            byId: { t1: { id: 't1', name: 'Family', capacity: 6, guestIds: ['g1', 'g2'] } },
            allIds: ['t1'],
          },
          meta: { avoidPairs: [['g1', 'g3'], ['broken']] },
        },
      },
    });

    expect(await importLabSeating({ weddingId: 'w', storage })).toBe(1);
    expect(tables().map((t) => [t.name, t.capacity, t.guestIds, t.weddingId])).toEqual([
      ['Family', 6, ['g1', 'g2'], 'w'],
    ]);
    expect(selectAvoidPairs(useSeatingStore.getState())).toEqual([['g1', 'g3']]);
    expect(storage.values[LABS_SEATING_KEY]).toBeUndefined();

    expect(await importLabSeating({ weddingId: 'w', storage: memory({}) })).toBe(0);
    expect(tables()).toHaveLength(1);
  });

  it('marks the import done when there was nothing to import', async () => {
    expect(await importLabSeating({ storage: memory({}) })).toBe(0);
    expect(store().labsImportedAt).toEqual(expect.any(String));
  });
});

describe('seating per event (F2)', () => {
  beforeEach(() => store().reset());

  it('keeps each event’s tables apart when seating and moving guests', () => {
    const day = store().addTable({ name: 'Day', capacity: 4 });
    const henna = store().addTable({ name: 'Henna', capacity: 4, eventId: 'ev_mehndi' });
    store().assign(day.id, 'g1');
    store().assign(henna.id, 'g1');
    // Seated at both: moving within one event never unseats them at the other.
    expect(tables().find((t) => t.id === day.id).guestIds).toEqual(['g1']);
    expect(tables().find((t) => t.id === henna.id).guestIds).toEqual(['g1']);

    store().unassign('g1', 'ev_mehndi');
    expect(tables().find((t) => t.id === henna.id).guestIds).toEqual([]);
    expect(tables().find((t) => t.id === day.id).guestIds).toEqual(['g1']);
  });

  it('auto-seats an event from its own guests, at its own tables', () => {
    store().addTable({ name: 'Day', capacity: 4 });
    const henna = store().addTable({ name: 'Henna', capacity: 4, eventId: 'ev_mehndi' });
    const event = {
      id: 'ev_mehndi',
      guestScope: 'invited',
      invitedGuestIds: ['g1', 'g2'],
      attendance: { g2: 'declined' },
    };
    const result = store().autoSeat([guest('g1'), guest('g2'), guest('g3')], { event });
    expect(result.placed).toBe(1);
    expect(tables().find((t) => t.id === henna.id).guestIds).toEqual(['g1']);
    expect(tables().find((t) => t.name === 'Day').guestIds).toEqual([]);
  });

  it('frees deleted guests everywhere, and does nothing for an empty list', () => {
    const day = store().addTable({ name: 'Day', capacity: 4 });
    const henna = store().addTable({ name: 'Henna', capacity: 4, eventId: 'ev_mehndi' });
    store().assign(day.id, 'g1');
    store().assign(henna.id, 'g1');
    store().assign(henna.id, 'g2');
    expect(store().forgetGuests([])).toBe(0);
    expect(store().forgetGuests(['g1'])).toBe(2);
    expect(tables().map((t) => t.guestIds)).toEqual([[], ['g2']]);
  });

  it('deletes an event’s tables with it, and never the wedding day’s', () => {
    store().addTable({ name: 'Day' });
    store().addTable({ name: 'Henna', eventId: 'ev_mehndi' });
    expect(store().clearEvent(null)).toBe(0);
    expect(store().clearEvent('ev_mehndi')).toBe(1);
    expect(tables().map((t) => t.name)).toEqual(['Day']);
  });
});
