import {
  useBudgetStore,
  useEventStore,
  useGuestStore,
  usePlanningStore,
  selectEvents,
  selectEventById,
  selectAllTasks,
  selectAllExpenses,
} from '@/store';
import { EVENT_LIMITS, GuestScope, createGuest, sortEvents } from '@/models';
import { deleteEvent, eventLinks } from '@/features/events/deleteEvent';

const events = () => sortEvents(selectEvents(useEventStore.getState()));
const store = () => useEventStore.getState();

beforeEach(() => {
  store().reset();
  useGuestStore.getState().reset();
  usePlanningStore.getState().reset();
  useBudgetStore.getState().reset();
});

describe('eventStore', () => {
  it('adds, updates and removes events', () => {
    const mehndi = store().addEvent({ weddingId: 'w1', kind: 'mehndi', date: '2027-05-07' });
    expect(events().map((e) => e.name)).toEqual(['Mehndi']);

    const updated = store().updateEvent(mehndi.id, { venueName: 'The Courtyard' });
    expect(updated.updatedAt >= mehndi.updatedAt).toBe(true);
    expect(selectEventById(mehndi.id)(store()).venueName).toBe('The Courtyard');

    expect(store().updateEvent('missing', { name: 'x' })).toBeNull();
    store().removeEvent(mehndi.id);
    expect(events()).toEqual([]);
  });

  it(`stops at ${EVENT_LIMITS.perWedding} events`, () => {
    for (let i = 0; i < EVENT_LIMITS.perWedding; i += 1)
      expect(store().addEvent({ name: `E${i}` })).toBeTruthy();
    expect(store().addEvent({ name: 'One too many' })).toBeNull();
    expect(events()).toHaveLength(EVENT_LIMITS.perWedding);
  });

  it('switches between everyone and a chosen list without losing the list', () => {
    const party = store().addEvent({ name: 'Party' });
    store().setInvitedGuests(party.id, ['g1', 'g2', 'g1']);
    expect(selectEventById(party.id)(store())).toMatchObject({
      guestScope: GuestScope.INVITED,
      invitedGuestIds: ['g1', 'g2'],
    });
    store().setEveryoneInvited(party.id);
    expect(selectEventById(party.id)(store())).toMatchObject({
      guestScope: GuestScope.EVERYONE,
      invitedGuestIds: ['g1', 'g2'],
    });
  });

  it('moves events only among those at the same date and time', () => {
    const a = store().addEvent({ name: 'A', date: '2027-05-08', startTime: '16:00' });
    const b = store().addEvent({ name: 'B', date: '2027-05-08', startTime: '16:00' });
    const c = store().addEvent({ name: 'C', date: '2027-05-09' });
    expect(events().map((e) => e.name)).toEqual(['A', 'B', 'C']);

    expect(store().moveEvent(b.id, -1)).toBe(true);
    expect(events().map((e) => e.name)).toEqual(['B', 'A', 'C']);
    expect(store().moveEvent(b.id, 1)).toBe(true);
    expect(events().map((e) => e.name)).toEqual(['A', 'B', 'C']);

    // C is on another day; the date decides, not the order.
    expect(store().moveEvent(c.id, -1)).toBe(false);
    expect(store().moveEvent(a.id, -1)).toBe(false);
    expect(store().moveEvent('missing', 1)).toBe(false);
  });

  it('takes deleted guests off every list', () => {
    const meera = useGuestStore.getState().addGuest(createGuest({ firstName: 'Meera' }));
    const ravi = useGuestStore.getState().addGuest(createGuest({ firstName: 'Ravi' }));
    const sam = useGuestStore.getState().addGuest(createGuest({ firstName: 'Sam' }));
    const party = store().addEvent({ name: 'Party' });
    const brunch = store().addEvent({ name: 'Brunch' });
    store().setInvitedGuests(party.id, [meera.id, ravi.id, sam.id]);
    store().setInvitedGuests(brunch.id, [ravi.id]);

    useGuestStore.getState().deleteGuest(ravi.id);
    expect(selectEventById(party.id)(store()).invitedGuestIds).toEqual([meera.id, sam.id]);
    expect(selectEventById(brunch.id)(store()).invitedGuestIds).toEqual([]);

    useGuestStore.getState().bulkDelete([meera.id]);
    expect(selectEventById(party.id)(store()).invitedGuestIds).toEqual([sam.id]);
  });

  it('keeps invitations when the guest list is merely empty', () => {
    const party = store().addEvent({ name: 'Party' });
    store().setInvitedGuests(party.id, ['g1']);
    // A workspace switch resets the guest store; that is not deleting anyone.
    useGuestStore.getState().reset();
    expect(store().forgetGuests([])).toBe(0);
    expect(selectEventById(party.id)(store()).invitedGuestIds).toEqual(['g1']);
  });
});

describe('deleteEvent', () => {
  it('keeps the event’s tasks and costs, for the wedding as a whole', () => {
    const mehndi = store().addEvent({ name: 'Mehndi' });
    const brunch = store().addEvent({ name: 'Brunch' });
    const henna = usePlanningStore.getState().addTask({ title: 'Book henna artist', eventId: mehndi.id });
    const cake = usePlanningStore.getState().addTask({ title: 'Order brunch cake', eventId: brunch.id });
    const deposit = useBudgetStore
      .getState()
      .addExpense({ title: 'Henna deposit', amount: 200, eventId: mehndi.id });

    expect(eventLinks(mehndi.id)).toEqual({ tasks: 1, expenses: 1 });
    deleteEvent(mehndi.id);

    expect(events().map((e) => e.name)).toEqual(['Brunch']);
    const tasks = new Map(selectAllTasks(usePlanningStore.getState()).map((t) => [t.id, t]));
    expect(tasks.get(henna.id).eventId).toBeNull();
    expect(tasks.get(cake.id).eventId).toBe(brunch.id);
    expect(selectAllExpenses(useBudgetStore.getState()).find((e) => e.id === deposit.id).eventId).toBeNull();
    expect(eventLinks(mehndi.id)).toEqual({ tasks: 0, expenses: 0 });
  });
});
