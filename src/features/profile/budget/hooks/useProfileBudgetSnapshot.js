import { useMemo } from 'react';

import { selectAllExpenses, selectBudget, useBudgetStore } from '@/store/budgetStore';
import { buildProfileBudgetSnapshot } from '../lib/budgetSnapshot';

export function useProfileBudgetSnapshot() {
  const budget = useBudgetStore(selectBudget);
  const expenses = useBudgetStore(selectAllExpenses);
  const summary = useMemo(() => buildProfileBudgetSnapshot(budget, expenses), [budget, expenses]);
  return { budget, expenses, summary };
}

export default useProfileBudgetSnapshot;
