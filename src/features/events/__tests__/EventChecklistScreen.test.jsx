import React from 'react';

import { useEventStore, usePlanningStore, selectAllTasks } from '@/store';
import { EventKind } from '@/models';
import { press, pressables, renderWithProviders, shownTexts } from '@/test/render';

import { EventChecklistScreen } from '../EventChecklistScreen';
import { EventFormScreen } from '../EventFormScreen';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

const tasks = () => selectAllTasks(usePlanningStore.getState());

let brunch;
beforeEach(() => {
  jest.clearAllMocks();
  useEventStore.getState().reset();
  usePlanningStore.getState().reset();
  brunch = useEventStore.getState().addEvent({ weddingId: 'w1', kind: EventKind.BRUNCH, date: '2030-06-02' });
});

const render = (id = brunch.id) => renderWithProviders(<EventChecklistScreen eventId={id} />);

describe('EventChecklistScreen', () => {
  it('adds nothing until the couple presses Add', async () => {
    const tree = await render();
    expect(shownTexts(tree)).toEqual(
      expect.arrayContaining([
        'Book the farewell brunch',
        'Confirm the brunch headcount',
        'Ask someone to host the brunch',
      ])
    );
    expect(tasks()).toEqual([]);

    await press(tree, 'Not now');
    expect(tasks()).toEqual([]);
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('adds only the ticked tasks, for this event, linked', async () => {
    const tree = await render();
    await press(tree, 'Ask someone to host the brunch'); // untick
    await press(tree, 'Add 2 tasks');

    const added = tasks();
    expect(added.map((t) => t.title).sort()).toEqual([
      'Book the farewell brunch',
      'Confirm the brunch headcount',
    ]);
    expect(added.every((t) => t.eventId === brunch.id)).toBe(true);
    const venue = added.find((t) => t.title === 'Book the farewell brunch');
    const headcount = added.find((t) => t.title === 'Confirm the brunch headcount');
    expect(headcount.waitsFor).toEqual([venue.id]);
    expect(venue.dueDate).toBe('2030-03-04');
  });

  it('marks what was already added and does not offer it again', async () => {
    const first = await render();
    await press(first, 'Ask someone to host the brunch');
    await press(first, 'Confirm the brunch headcount');
    await press(first, 'Add 1 task');
    expect(tasks()).toHaveLength(1);

    const tree = await render();
    expect(shownTexts(tree)).toContain('Already on your checklist');
    expect(pressables(tree, 'Add 2 tasks')).toHaveLength(1);
    await press(tree, 'Add 2 tasks');
    expect(
      tasks()
        .map((t) => t.title)
        .sort()
    ).toEqual(['Ask someone to host the brunch', 'Book the farewell brunch', 'Confirm the brunch headcount']);
  });

  it('cannot add with nothing ticked', async () => {
    const tree = await render();
    for (const title of [
      'Book the farewell brunch',
      'Confirm the brunch headcount',
      'Ask someone to host the brunch',
    ]) {
      await press(tree, title);
    }
    const button = pressables(tree, 'Choose tasks to add')[0];
    expect(button.props.disabled ?? button.props.accessibilityState?.disabled).toBe(true);
  });

  it('says so when the event is gone', async () => {
    const tree = await render('event_gone');
    expect(shownTexts(tree)).toContain('This event is gone');
  });
});

describe('EventFormScreen and checklists', () => {
  it('goes straight back after adding an event with no checklist', async () => {
    const tree = await renderWithProviders(<EventFormScreen />);
    await press(tree, 'Add event');
    expect(mockRouter.back).toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('opens the suggestions from an existing event', async () => {
    const tree = await renderWithProviders(<EventFormScreen eventId={brunch.id} />);
    await press(tree, 'Suggested tasks');
    expect(mockRouter.push).toHaveBeenCalledWith(`/planning/events/${brunch.id}/checklist`);
  });
});
