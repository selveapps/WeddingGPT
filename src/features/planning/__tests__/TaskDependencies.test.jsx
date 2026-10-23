import React from 'react';

import { usePlanningStore } from '@/store';
import { TaskStatus } from '@/models';
import { act, press, pressables, renderWithProviders, shownTexts } from '@/test/render';

import { TaskDependencies } from '../TaskDependencies';
import { TaskRow } from '../TaskRow';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

const store = () => usePlanningStore.getState();
const get = (id) => store().tasks.byId[id];

/** Re-reads the task from the store and, like the detail screen, renders nothing once it is gone. */
function Section({ id }) {
  const task = usePlanningStore((state) => state.tasks.byId[id]);
  return task ? <TaskDependencies task={task} /> : null;
}

let list;
let venue;
let invites;
beforeEach(() => {
  jest.clearAllMocks();
  store().reset();
  list = store().addTask({ title: 'Build the full guest list' });
  venue = store().addTask({ title: 'Book the ceremony venue' });
  invites = store().addTask({ title: 'Send the invitations' });
});

describe('TaskDependencies', () => {
  it('adds a task to wait for from the sheet', async () => {
    const tree = await renderWithProviders(<Section id={invites.id} />);
    await press(tree, 'Wait for another task');
    await press(tree, 'Build the full guest list');
    expect(get(invites.id).waitsFor).toEqual([list.id]);
    expect(shownTexts(tree)).toContain(
      'Waiting for 1 task. It stays off your daily list until that is done, but you can still tick it off.'
    );
  });

  it('never offers a task that would close a loop, or the task itself', async () => {
    store().addPrerequisite(invites.id, list.id);
    const tree = await renderWithProviders(<Section id={list.id} />);
    await press(tree, 'Wait for another task');
    // Only the venue is on offer: the invitations already wait for the list.
    expect(pressables(tree, 'Book the ceremony venue')).toHaveLength(1);
    expect(pressables(tree, 'Send the invitations')).toHaveLength(1); // the "Waiting for this" row
    expect(pressables(tree, 'Build the full guest list')).toHaveLength(0);
  });

  it('searches the tasks on offer', async () => {
    const tree = await renderWithProviders(<Section id={invites.id} />);
    await press(tree, 'Wait for another task');
    const search = tree.root.find((n) => n.props.label === 'Search tasks' && n.props.onChangeText);
    await act(async () => search.props.onChangeText('venue'));
    expect(pressables(tree, 'Book the ceremony venue')).toHaveLength(1);
    expect(pressables(tree, 'Build the full guest list')).toHaveLength(0);
  });

  it('shows done prerequisites as done and stops waiting on request', async () => {
    store().addPrerequisite(invites.id, list.id);
    store().addPrerequisite(invites.id, venue.id);
    store().toggleTask(list.id);
    const tree = await renderWithProviders(<Section id={invites.id} />);
    expect(shownTexts(tree)).toEqual(expect.arrayContaining(['Done', 'To do']));
    expect(shownTexts(tree).some((t) => t.startsWith('Waiting for 1 task.'))).toBe(true);

    await press(tree, 'Stop waiting for Book the ceremony venue');
    expect(get(invites.id).waitsFor).toEqual([list.id]);
    expect(shownTexts(tree).some((t) => t.startsWith('Waiting for'))).toBe(false);
  });

  it('lists what waits for this task and opens it', async () => {
    store().addPrerequisite(invites.id, list.id);
    const tree = await renderWithProviders(<Section id={list.id} />);
    expect(shownTexts(tree)).toContain('Waiting for this');
    await press(tree, 'Send the invitations');
    expect(mockRouter.push).toHaveBeenCalledWith(`/planning/task/${invites.id}`);
  });
});

describe('TaskRow', () => {
  it('says how many tasks it waits for, until it is done', async () => {
    const tree = await renderWithProviders(<TaskRow task={invites} waitingFor={2} />);
    expect(shownTexts(tree)).toContain('Waits for 2');

    const done = await renderWithProviders(
      <TaskRow task={{ ...invites, status: TaskStatus.DONE }} waitingFor={2} />
    );
    expect(shownTexts(done)).not.toContain('Waits for 2');

    const free = await renderWithProviders(<TaskRow task={invites} />);
    expect(shownTexts(free).join(' ')).not.toMatch(/Waits for|^0$/);
  });
});
