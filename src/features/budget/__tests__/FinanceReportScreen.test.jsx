import React from 'react';

import { useBudgetStore, useEventStore, useWeddingStore, selectAllBudgetCategories } from '@/store';
import { ExpenseCommitment, createWedding } from '@/models';
import { addDays, todayISO } from '@/lib/date';
import { act, press, renderWithProviders, shownTexts } from '@/test/render';

import { FinanceReportScreen } from '../FinanceReportScreen';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

const mockExport = jest.fn(async () => 'downloaded');
jest.mock('@/services/files', () => ({
  datedFilename: (stem) => `${stem}-2027-01-04.csv`,
  exportTextFile: (...args) => mockExport(...args),
}));

const store = () => useBudgetStore.getState();
const category = (name) => selectAllBudgetCategories(store()).find((c) => c.name === name);

beforeEach(() => {
  jest.clearAllMocks();
  store().reset();
  useEventStore.getState().reset();
  useWeddingStore.setState({ wedding: createWedding({ ownerName: 'Priya' }) });
});

const withBudget = () => {
  store().initialiseBudget({ weddingId: 'w1', total: 20000_00, currency: 'USD' });
  const flowers = selectAllBudgetCategories(store())[0];
  store().updateCategory(flowers.id, { name: 'Flowers', allocated: 1000_00 });
  return category('Flowers');
};

const render = () => renderWithProviders(<FinanceReportScreen />);
const has = (tree, pattern) => shownTexts(tree).some((text) => pattern.test(text));

describe('FinanceReportScreen', () => {
  it('asks for a budget first', async () => {
    const tree = await render();
    expect(shownTexts(tree)).toContain('No budget set');
    await press(tree, 'Set a budget');
    expect(mockRouter.push).toHaveBeenCalledWith('/budget/setup');
  });

  it('flags a category that has gone over its plan', async () => {
    const flowers = withBudget();
    store().addExpense({
      title: 'Florist',
      amount: 1500_00,
      budgetCategoryId: flowers.id,
      commitment: ExpenseCommitment.COMMITTED,
    });
    const tree = await render();
    expect(shownTexts(tree)).toContain('Over plan: Flowers');
    expect(has(tree, /^Over by \$500/)).toBe(true);

    await press(tree, 'Flowers');
    expect(mockRouter.push).toHaveBeenCalledWith(`/budget/category/${flowers.id}`);
  });

  it('splits costs by event', async () => {
    withBudget();
    const mehndi = useEventStore.getState().addEvent({ kind: 'mehndi', date: '2030-05-07' });
    store().addExpense({ title: 'Henna', amount: 300_00, paidAmount: 300_00, eventId: mehndi.id });
    store().addExpense({ title: 'Photographer', amount: 3000_00, commitment: ExpenseCommitment.COMMITTED });
    const tree = await render();
    await act(async () => tree.root.find((n) => n.props.options && n.props.onChange).props.onChange('event'));
    expect(shownTexts(tree)).toEqual(expect.arrayContaining(['Mehndi', 'Whole wedding']));
    expect(has(tree, /^\$300 paid/)).toBe(true);
  });

  it('shows what is due each month and what is overdue', async () => {
    withBudget();
    store().addExpense({
      title: 'Venue balance',
      amount: 5000_00,
      paidAmount: 1000_00,
      commitment: ExpenseCommitment.COMMITTED,
      dueDate: addDays(todayISO(), 40),
    });
    store().addExpense({
      title: 'Cake deposit',
      amount: 200_00,
      commitment: ExpenseCommitment.COMMITTED,
      dueDate: addDays(todayISO(), -3),
    });
    const tree = await render();
    await act(async () => tree.root.find((n) => n.props.options && n.props.onChange).props.onChange('due'));
    expect(shownTexts(tree)).toContain('Overdue (1)');
    expect(shownTexts(tree)).toContain('Cake deposit');
    expect(has(tree, /\$4,200 still to pay/)).toBe(true);
    expect(shownTexts(tree)).not.toContain('Venue balance');

    // Opening the month lists its payments.
    const month = tree.root.find((n) => n.props.subtitle === '1 payment' && n.props.onPress);
    await act(async () => month.props.onPress());
    expect(shownTexts(tree)).toContain('Venue balance');
  });

  it('exports the report as CSV', async () => {
    withBudget();
    const tree = await render();
    await press(tree, 'Export as CSV');
    expect(mockExport).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'budget-report-2027-01-04.csv', title: 'Budget report' })
    );
    expect(mockExport.mock.calls[0][0].text).toMatch(/^Budget report \(USD\)/);
  });
});
