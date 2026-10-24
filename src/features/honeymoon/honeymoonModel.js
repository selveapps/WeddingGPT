export function parseBudget(value) {
  const amount = Number(String(value ?? '').replace(/[,₹\s]/g, ''));
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

export function summarizeTrip(trip = {}) {
  const budget = parseBudget(trip.budget);
  const expenses = Array.isArray(trip.expenses) ? trip.expenses : [];
  const spent = expenses.reduce((sum, expense) => sum + parseBudget(expense.amount), 0);
  return { budget, spent, remaining: Math.max(0, budget - spent), overBudget: spent > budget };
}

export function validateExpense(expense) {
  const title = String(expense.title ?? '').trim();
  const amount = parseBudget(expense.amount);
  if (!title) throw new Error('Enter an expense name.');
  if (amount <= 0) throw new Error('Enter an amount greater than zero.');
  return { title, amount, category: String(expense.category ?? 'Other').trim() || 'Other' };
}

export function groupExpenses(expenses = []) {
  return expenses.reduce((groups, item) => {
    const category = item.category || 'Other';
    groups[category] = (groups[category] || 0) + parseBudget(item.amount);
    return groups;
  }, {});
}
