import { groupExpenses, summarizeTrip, validateExpense } from '../honeymoonModel';

describe('honeymoon planner model', () => {
  test('summarizes trip spend and remaining budget', () => {
    expect(summarizeTrip({ budget: '50000', expenses: [{ amount: 12000 }, { amount: 3000 }] })).toEqual({ budget: 50000, spent: 15000, remaining: 35000, overBudget: false });
  });
  test('detects over-budget trips', () => {
    expect(summarizeTrip({ budget: 100, expenses: [{ amount: 120 }] }).overBudget).toBe(true);
  });
  test('groups spending by category', () => {
    expect(groupExpenses([{ category: 'Travel', amount: 100 }, { category: 'Travel', amount: 25 }, { category: 'Hotel', amount: 50 }])).toEqual({ Travel: 125, Hotel: 50 });
  });
  test('validates and normalizes an expense', () => {
    expect(validateExpense({ title: ' Flight ', amount: '2500', category: ' Travel ' })).toEqual({ title: 'Flight', amount: 2500, category: 'Travel' });
    expect(() => validateExpense({ title: '', amount: 20 })).toThrow('expense name');
    expect(() => validateExpense({ title: 'Flight', amount: 0 })).toThrow('greater than zero');
  });
});
