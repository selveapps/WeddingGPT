import { summariseBudget } from '@/models';

export function buildProfileBudgetSnapshot(budget, expenses = []) {
  if (!budget) return null;
  const summary = summariseBudget(budget.total ?? 0, expenses);
  return {
    ...summary,
    currency: budget.currency,
    expenseCount: expenses.length,
    isConfigured: Number(budget.total) > 0,
  };
}

export function budgetStatusLabel(summary) {
  if (!summary) return 'No budget yet';
  if (!summary.isConfigured) return 'Add a total to start tracking';
  if (summary.isOverBudget) return 'Over budget';
  if (summary.projectedRemaining < 0) return 'Estimates exceed the remaining budget';
  return 'Budget is on track';
}

export function profileBudgetProgress(summary) {
  return summary?.usedRatio ?? 0;
}
