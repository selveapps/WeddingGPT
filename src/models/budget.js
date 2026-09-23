import { createEntity } from './base';
import { PaymentStatus, ExpenseCommitment } from './enums';
import { DEFAULT_CURRENCY } from '../lib/currency';

/**
 * Budget, categories and expenses.
 *
 * All amounts are integer minor units (see `lib/currency`). The Budget entity
 * stores only `total`; spent, committed and remaining are *derived* from the
 * expense list by `summariseBudget`. Storing them would create a second source
 * of truth that drifts the first time an expense is edited and a write fails.
 */

/**
 * Typical allocation of a wedding budget, as fractions of the total.
 * Used to seed a starting structure after onboarding so the couple sees a real
 * budget rather than an empty screen. Every figure stays editable.
 */
export const DEFAULT_BUDGET_ALLOCATION = [
  { key: 'venue', name: 'Venue and rentals', share: 0.3, icon: 'location' },
  { key: 'catering', name: 'Catering and bar', share: 0.22, icon: 'vendors' },
  { key: 'photo', name: 'Photo and video', share: 0.12, icon: 'camera' },
  { key: 'attire', name: 'Attire and beauty', share: 0.08, icon: 'star' },
  { key: 'decor', name: 'Flowers and decor', share: 0.08, icon: 'vision' },
  { key: 'music', name: 'Music and entertainment', share: 0.07, icon: 'sparkle' },
  { key: 'stationery', name: 'Invitations and stationery', share: 0.03, icon: 'mail' },
  { key: 'rings', name: 'Rings', share: 0.04, icon: 'rings' },
  { key: 'transport', name: 'Transport and stays', share: 0.03, icon: 'location' },
  { key: 'buffer', name: 'Buffer', share: 0.03, icon: 'info' },
];

export function createBudget({ weddingId, total = 0, currency = DEFAULT_CURRENCY } = {}) {
  return createEntity('budget', { weddingId, total, currency });
}

export function createBudgetCategory({
  budgetId,
  weddingId,
  key = null,
  name,
  allocated = 0,
  icon = 'budget',
  order = 0,
} = {}) {
  return createEntity('bcat', { budgetId, weddingId, key, name, allocated, icon, order });
}

export function createExpense({
  budgetCategoryId = null,
  weddingId,
  vendorId = null,
  vendorName = '',
  title,
  amount = 0,
  /** How much of `amount` has actually been handed over. */
  paidAmount = 0,
  paymentStatus = PaymentStatus.UNPAID,
  commitment = ExpenseCommitment.ESTIMATED,
  date = null,
  dueDate = null,
  notes = '',
} = {}) {
  return createEntity('exp', {
    budgetCategoryId,
    weddingId,
    vendorId,
    vendorName,
    title,
    amount,
    paidAmount,
    paymentStatus,
    commitment,
    date,
    dueDate,
    notes,
  });
}

/**
 * Roll expenses up into the figures the Budget screen shows.
 *
 * The three numbers mean distinct things, and conflating them is the usual way
 * a budget tool becomes untrustworthy:
 *  - spent      money that has actually left the account
 *  - committed  money contractually owed but not yet paid
 *  - remaining  total minus (spent + committed), i.e. what is genuinely free
 *
 * `estimated` is tracked separately: it is a guess, so it informs but does not
 * reduce what the couple can still allocate.
 */
export function summariseBudget(total = 0, expenses = []) {
  let spent = 0;
  let committedUnpaid = 0;
  let estimated = 0;

  for (const expense of expenses) {
    const amount = expense.amount ?? 0;
    const paid = Math.min(expense.paidAmount ?? 0, amount);

    spent += paid;

    if (expense.commitment === ExpenseCommitment.COMMITTED) {
      committedUnpaid += amount - paid;
    } else {
      estimated += amount - paid;
    }
  }

  const allocated = spent + committedUnpaid;
  const remaining = total - allocated;

  return {
    total,
    spent,
    committed: committedUnpaid,
    /** Spent + committed. What the budget is actually carrying. */
    allocated,
    estimated,
    remaining,
    isOverBudget: remaining < 0,
    /** 0-1, clamped. Feeds the progress bar. */
    usedRatio: total > 0 ? Math.min(1, Math.max(0, allocated / total)) : 0,
    /** Projected position if every estimate lands as guessed. */
    projectedRemaining: total - allocated - estimated,
  };
}

/** Per-category rollup, for the drill-down list and over-allocation warnings. */
export function summariseCategory(category, expenses = []) {
  const ours = expenses.filter((e) => e.budgetCategoryId === category.id);
  const summary = summariseBudget(category.allocated ?? 0, ours);
  return {
    ...summary,
    categoryId: category.id,
    name: category.name,
    expenseCount: ours.length,
    isOverAllocated: summary.allocated > (category.allocated ?? 0),
  };
}

/**
 * Seed a category structure from a total, using the default allocation.
 * Rounds to whole minor units and pushes any rounding remainder into the
 * buffer, so the categories always sum to exactly the total.
 */
export function buildDefaultCategories(budgetId, weddingId, total) {
  const categories = DEFAULT_BUDGET_ALLOCATION.map((entry, index) =>
    createBudgetCategory({
      budgetId,
      weddingId,
      key: entry.key,
      name: entry.name,
      icon: entry.icon,
      order: index,
      allocated: Math.round(total * entry.share),
    })
  );

  const sum = categories.reduce((acc, c) => acc + c.allocated, 0);
  const drift = total - sum;
  if (drift !== 0 && categories.length) {
    const buffer = categories.find((c) => c.key === 'buffer') ?? categories[categories.length - 1];
    buffer.allocated += drift;
  }

  return categories;
}
