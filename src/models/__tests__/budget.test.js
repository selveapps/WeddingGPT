import {
  buildDefaultCategories,
  DEFAULT_BUDGET_ALLOCATION,
  summariseBudget,
  summariseCategory,
} from '../budget';
import { ExpenseCommitment } from '../enums';

const expense = (amount, paidAmount, commitment, extra = {}) => ({
  amount,
  paidAmount,
  commitment,
  ...extra,
});

describe('DEFAULT_BUDGET_ALLOCATION', () => {
  it('shares add up to the whole budget', () => {
    const total = DEFAULT_BUDGET_ALLOCATION.reduce((sum, entry) => sum + entry.share, 0);
    expect(total).toBeCloseTo(1, 10);
  });
});

describe('summariseBudget', () => {
  it('splits money into spent, committed and estimated', () => {
    const summary = summariseBudget(100000, [
      expense(30000, 10000, ExpenseCommitment.COMMITTED),
      expense(20000, 0, ExpenseCommitment.ESTIMATED),
      expense(5000, 5000, ExpenseCommitment.ESTIMATED),
    ]);
    expect(summary).toMatchObject({
      spent: 15000,
      committed: 20000,
      allocated: 35000,
      estimated: 20000,
      remaining: 65000,
      projectedRemaining: 45000,
      isOverBudget: false,
    });
    expect(summary.usedRatio).toBeCloseTo(0.35);
  });

  it('never counts more paid than the expense amount', () => {
    expect(summariseBudget(1000, [expense(500, 800, ExpenseCommitment.COMMITTED)]).spent).toBe(500);
  });

  it('flags going over budget and clamps the ratio', () => {
    const summary = summariseBudget(1000, [expense(1500, 0, ExpenseCommitment.COMMITTED)]);
    expect(summary.isOverBudget).toBe(true);
    expect(summary.remaining).toBe(-500);
    expect(summary.usedRatio).toBe(1);
  });

  it('is safe with no total or expenses', () => {
    expect(summariseBudget()).toMatchObject({ total: 0, spent: 0, remaining: 0, usedRatio: 0 });
  });
});

describe('summariseCategory', () => {
  it('only counts expenses in that category', () => {
    const category = { id: 'cat1', name: 'Venue', allocated: 1000 };
    const summary = summariseCategory(category, [
      expense(1200, 0, ExpenseCommitment.COMMITTED, { budgetCategoryId: 'cat1' }),
      expense(999, 0, ExpenseCommitment.COMMITTED, { budgetCategoryId: 'cat2' }),
    ]);
    expect(summary).toMatchObject({
      categoryId: 'cat1',
      name: 'Venue',
      expenseCount: 1,
      allocated: 1200,
    });
    expect(summary.isOverAllocated).toBe(true);
  });
});

describe('buildDefaultCategories', () => {
  it('creates one category per allocation entry in order', () => {
    const categories = buildDefaultCategories('budget_1', 'wed_1', 1000000);
    expect(categories.map((c) => c.key)).toEqual(DEFAULT_BUDGET_ALLOCATION.map((e) => e.key));
    expect(categories.every((c) => c.budgetId === 'budget_1' && c.weddingId === 'wed_1')).toBe(true);
    expect(categories.find((c) => c.key === 'venue').allocated).toBe(300000);
  });

  it('always sums to exactly the total, pushing rounding into the buffer', () => {
    for (const total of [0, 1, 99, 333333, 4567891]) {
      const categories = buildDefaultCategories('b', 'w', total);
      expect(categories.reduce((sum, c) => sum + c.allocated, 0)).toBe(total);
    }
  });
});
