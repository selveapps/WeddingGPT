import React from 'react';

import {
  useBudgetStore,
  useEventStore,
  useGuestStore,
  usePlanningStore,
  useWeddingStore,
  selectEvents,
  selectEventById,
} from '@/store';
import { GuestScope, RsvpStatus, createGuest, createWedding, sortEvents } from '@/models';
import { act, press, pressables, renderWithProviders, shownTexts } from '@/test/render';

import { EventsScreen } from '../EventsScreen';
import { EventFormScreen } from '../EventFormScreen';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

const events = () => sortEvents(selectEvents(useEventStore.getState()));
const field = (tree, label) =>
  tree.root.find((n) => n.props.label === label && typeof n.props.onChangeText === 'function');
const type = (tree, label, text) => act(async () => field(tree, label).props.onChangeText(text));

let wedding;
let meera;
let ravi;
beforeEach(() => {
  jest.clearAllMocks();
  useEventStore.getState().reset();
  useGuestStore.getState().reset();
  usePlanningStore.getState().reset();
  useBudgetStore.getState().reset();
  wedding = createWedding({ ownerName: 'Priya' });
  useWeddingStore.setState({ wedding });
  meera = useGuestStore
    .getState()
    .addGuest(createGuest({ weddingId: wedding.id, firstName: 'Meera', rsvpStatus: RsvpStatus.ATTENDING }));
  ravi = useGuestStore.getState().addGuest(createGuest({ weddingId: wedding.id, firstName: 'Ravi' }));
});

describe('EventsScreen', () => {
  it('invites a couple with one event to add more', async () => {
    const tree = await renderWithProviders(<EventsScreen />);
    expect(shownTexts(tree)).toContain('One day, or a few?');
    await press(tree, 'Add an event');
    expect(mockRouter.push).toHaveBeenCalledWith('/planning/events/new');
  });

  it('lists events by date with their guests, tasks and costs', async () => {
    const reception = useEventStore
      .getState()
      .addEvent({ kind: 'reception', date: '2027-05-08', startTime: '19:00', venueName: 'The Hall' });
    const mehndi = useEventStore.getState().addEvent({ kind: 'mehndi', date: '2027-05-07' });
    useEventStore.getState().setInvitedGuests(mehndi.id, [meera.id]);
    usePlanningStore.getState().addTask({ title: 'Book henna', eventId: mehndi.id });
    useBudgetStore.getState().addExpense({ title: 'DJ', amount: 500, eventId: reception.id });
    useBudgetStore.getState().addExpense({ title: 'Bar', amount: 900, eventId: reception.id });

    const tree = await renderWithProviders(<EventsScreen />);
    const texts = shownTexts(tree);
    expect(texts.indexOf('Mehndi')).toBeLessThan(texts.indexOf('Reception'));
    expect(texts).toEqual(
      expect.arrayContaining([
        'The Hall',
        '1 invited',
        '1 attending',
        '1 task',
        '2 costs',
        'Everyone invited',
      ])
    );

    await press(tree, 'Edit Reception');
    expect(mockRouter.push).toHaveBeenCalledWith(`/planning/events/${reception.id}`);
  });

  it('reorders only events that share a time', async () => {
    useEventStore.getState().addEvent({ name: 'Photos', date: '2027-05-08', startTime: '15:00' });
    useEventStore.getState().addEvent({ name: 'Drinks', date: '2027-05-08', startTime: '15:00' });
    useEventStore.getState().addEvent({ name: 'Dinner', date: '2027-05-08', startTime: '19:00' });

    const tree = await renderWithProviders(<EventsScreen />);
    expect(pressables(tree, 'Move Dinner up')).toHaveLength(0);
    expect(pressables(tree, 'Move Photos up')).toHaveLength(0);
    await press(tree, 'Move Drinks up');
    expect(events().map((e) => e.name)).toEqual(['Drinks', 'Photos', 'Dinner']);
  });
});

describe('EventFormScreen', () => {
  it('adds an event, named after its kind when left unnamed', async () => {
    const tree = await renderWithProviders(<EventFormScreen />);
    await press(tree, 'Sangeet');
    await act(async () =>
      tree.root
        .find((n) => n.props.label === 'Date' && typeof n.props.onChange === 'function')
        .props.onChange('2027-05-06')
    );
    await type(tree, 'Starts', '7pm');
    await type(tree, 'Ends', '11:30 pm');
    await type(tree, 'Venue', 'The Courtyard');
    await type(tree, 'Dress code', 'Bright colours');
    await press(tree, 'Add event');

    expect(events()).toHaveLength(1);
    expect(events()[0]).toMatchObject({
      weddingId: wedding.id,
      name: 'Sangeet',
      kind: 'sangeet',
      date: '2027-05-06',
      startTime: '19:00',
      endTime: '23:30',
      venueName: 'The Courtyard',
      dressCode: 'Bright colours',
      guestScope: GuestScope.EVERYONE,
    });
    // A sangeet has a suggested checklist, so that is offered next.
    expect(mockRouter.replace).toHaveBeenCalledWith(`/planning/events/${events()[0].id}/checklist`);
  });

  it('refuses a time it cannot read and saves nothing', async () => {
    const tree = await renderWithProviders(<EventFormScreen />);
    await type(tree, 'Starts', 'after lunch');
    await press(tree, 'Add event');
    expect(events()).toEqual([]);
    expect(shownTexts(tree)).toContain('Try a time like 4pm or 16:30.');
  });

  it('chooses who is invited', async () => {
    const tree = await renderWithProviders(<EventFormScreen />);
    expect(shownTexts(tree)).toContain('Everyone on your list (2)');
    await press(tree, 'Chosen guests');
    await press(tree, 'Choose guests');
    await press(tree, 'Ravi');
    await press(tree, 'Done');
    expect(shownTexts(tree)).toContain('1 guest invited');
    await press(tree, 'Add event');
    expect(events()[0]).toMatchObject({ guestScope: GuestScope.INVITED, invitedGuestIds: [ravi.id] });
  });

  it('edits an event, starting from its saved values', async () => {
    const brunch = useEventStore.getState().addEvent({ kind: 'brunch', startTime: '10:00' });
    const tree = await renderWithProviders(<EventFormScreen eventId={brunch.id} />);
    expect(field(tree, 'Starts').props.value).toBe('10:00 AM');
    await type(tree, 'Name', 'Sunday brunch');
    await press(tree, 'Save event');
    expect(selectEventById(brunch.id)(useEventStore.getState())).toMatchObject({
      name: 'Sunday brunch',
      startTime: '10:00',
    });
  });

  it('deletes an event after confirming, keeping its tasks', async () => {
    const mehndi = useEventStore.getState().addEvent({ kind: 'mehndi' });
    const task = usePlanningStore.getState().addTask({ title: 'Book henna', eventId: mehndi.id });
    const tree = await renderWithProviders(<EventFormScreen eventId={mehndi.id} />);

    await press(tree, 'Delete event');
    expect(shownTexts(tree)).toContain(
      'Its 1 task stay, as part of the wedding as a whole. This cannot be undone.'
    );
    expect(events()).toHaveLength(1);
    await press(tree, 'Delete');

    expect(events()).toEqual([]);
    expect(usePlanningStore.getState().tasks.byId[task.id].eventId).toBeNull();
    expect(mockRouter.replace).toHaveBeenCalledWith('/planning/events');
  });

  it('says so when the event was deleted elsewhere', async () => {
    const tree = await renderWithProviders(<EventFormScreen eventId="event_gone" />);
    expect(shownTexts(tree)).toContain('This event is gone');
  });
});
