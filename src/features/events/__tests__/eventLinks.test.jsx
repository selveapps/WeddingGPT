import React from 'react';

import { useBudgetStore, useEventStore, usePlanningStore, useWeddingStore } from '@/store';
import { createWedding } from '@/models';
import { act, press, pressables, renderWithProviders, shownTexts } from '@/test/render';
import { TaskForm } from '@/features/planning/TaskForm';
import { ExpenseForm } from '@/features/budget/ExpenseForm';
import PlanningScreen from '../../../../app/(tabs)/planning';
import BudgetScreen from '../../../../app/(tabs)/budget';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

let mehndi;
beforeEach(() => {
  jest.clearAllMocks();
  useEventStore.getState().reset();
  usePlanningStore.getState().reset();
  useBudgetStore.getState().reset();
  useWeddingStore.setState({ wedding: createWedding({ ownerName: 'Priya' }) });
});

const addEvents = () => {
  mehndi = useEventStore.getState().addEvent({ kind: 'mehndi', date: '2027-05-07' });
  useEventStore.getState().addEvent({ kind: 'reception', date: '2027-05-08' });
};

describe('assigning to an event', () => {
  it('shows no event choice until the wedding has events', async () => {
    const tree = await renderWithProviders(<TaskForm onSubmit={jest.fn()} />);
    expect(pressables(tree, 'The whole wedding')).toHaveLength(0);
  });

  it('saves a task for an event, and back to the whole wedding', async () => {
    addEvents();
    const onSubmit = jest.fn();
    const tree = await renderWithProviders(
      <TaskForm initial={{ title: 'Book henna' }} onSubmit={onSubmit} />
    );
    await press(tree, 'Mehndi');
    await press(tree, 'Save');
    expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({ eventId: mehndi.id }));

    await press(tree, 'The whole wedding');
    await press(tree, 'Save');
    expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({ eventId: null }));
  });

  it('saves an expense for an event and starts an edit from it', async () => {
    addEvents();
    const onSubmit = jest.fn();
    const tree = await renderWithProviders(
      <ExpenseForm initial={{ title: 'Henna artist', amount: 300, eventId: mehndi.id }} onSubmit={onSubmit} />
    );
    const chip = pressables(tree, 'Mehndi')[0];
    expect(chip.props.accessibilityState?.checked).toBe(true);
    await press(tree, 'Save');
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ eventId: mehndi.id, amount: 300 }));
  });
});

describe('filtering by event', () => {
  it('filters the checklist by event', async () => {
    addEvents();
    usePlanningStore.getState().addTask({ title: 'Book henna', eventId: mehndi.id });
    usePlanningStore.getState().addTask({ title: 'Choose rings' });
    const tree = await renderWithProviders(<PlanningScreen />);
    expect(shownTexts(tree)).toEqual(
      expect.arrayContaining(['Book henna', 'Choose rings', 'Mehndi, Reception'])
    );

    await press(tree, 'Mehndi');
    expect(shownTexts(tree)).toContain('Book henna');
    expect(shownTexts(tree)).not.toContain('Choose rings');

    // The filtered event is deleted elsewhere: the list falls back to everything.
    await act(async () => useEventStore.getState().removeEvent(mehndi.id));
    expect(shownTexts(tree)).toContain('Choose rings');
  });

  it('opens the events list from Planning', async () => {
    usePlanningStore.getState().addTask({ title: 'Choose rings' });
    const tree = await renderWithProviders(<PlanningScreen />);
    await press(tree, 'Events');
    expect(mockRouter.push).toHaveBeenCalledWith('/planning/events');
  });

  it('shows the costs of one event with their total', async () => {
    addEvents();
    useBudgetStore.getState().initialiseBudget({ weddingId: 'w1', total: 20000, currency: 'USD' });
    useBudgetStore.getState().addExpense({ title: 'Henna artist', amount: 300, eventId: mehndi.id });
    useBudgetStore.getState().addExpense({ title: 'Mehndi decor', amount: 700, eventId: mehndi.id });
    useBudgetStore.getState().addExpense({ title: 'Photographer', amount: 3000 });
    const tree = await renderWithProviders(<BudgetScreen />);
    await press(tree, 'Mehndi');
    const texts = shownTexts(tree);
    expect(texts).toEqual(expect.arrayContaining(['Mehndi costs', 'Henna artist', 'Mehndi decor']));
    expect(texts).not.toContain('Photographer');
  });
});
