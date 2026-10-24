import { cleanText, finiteNonNegative, makeId } from './storage';

export const BUDGET_CATEGORIES = [
  'Venue', 'Catering', 'Photography', 'Videography', 'Attire', 'Decor',
  'Flowers', 'Music', 'Transport', 'Accommodation', 'Invitations',
  'Beauty', 'Gifts', 'Ceremony', 'Other',
];

export function normalizeExpense(input = {}) {
  return {
    id: cleanText(input.id, 100) || makeId('expense'),
    title: cleanText(input.title, 120) || 'Untitled expense',
    category: cleanText(input.category, 80) || 'Other',
    estimated: finiteNonNegative(input.estimated),
    actual: finiteNonNegative(input.actual),
    paid: finiteNonNegative(input.paid),
    dueDate: cleanText(input.dueDate, 10),
    vendor: cleanText(input.vendor, 120),
    notes: cleanText(input.notes, 500),
    priority: ['high', 'medium', 'low'].includes(input.priority) ? input.priority : 'medium',
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: input.updatedAt || new Date().toISOString(),
  };
}

export function validateExpense(input = {}) {
  const errors = {};
  if (!cleanText(input.title, 120)) errors.title = 'Add an expense name.';
  if (!cleanText(input.category, 80)) errors.category = 'Select a category.';
  ['estimated', 'actual', 'paid'].forEach((key) => {
    const raw = input[key] === '' || input[key] == null ? 0 : Number(input[key]);
    if (!Number.isFinite(raw) || raw < 0) errors[key] = `${key} must be a non-negative number.`;
  });
  const current = Number(input.actual || input.estimated || 0);
  if (Number(input.paid || 0) > current) errors.paid = 'Paid amount cannot exceed the current cost.';
  if (input.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)) errors.dueDate = 'Use YYYY-MM-DD for the due date.';
  return errors;
}

export function addExpense(items, draft) {
  return [...items, normalizeExpense({ ...draft, id: makeId('expense') })];
}

export function updateExpense(items, id, patch) {
  return items.map((item) => item.id === id
    ? normalizeExpense({ ...item, ...patch, id, updatedAt: new Date().toISOString() })
    : item);
}

export function removeExpense(items, id) {
  return items.filter((item) => item.id !== id);
}

export function effectiveCost(input) {
  const item = normalizeExpense(input);
  return item.actual > 0 ? item.actual : item.estimated;
}

export function getBudgetSummary(items = [], limitValue = 0) {
  const expenses = items.map(normalizeExpense);
  const limit = finiteNonNegative(limitValue);
  const planned = expenses.reduce((sum, item) => sum + item.estimated, 0);
  const actual = expenses.reduce((sum, item) => sum + effectiveCost(item), 0);
  const paid = expenses.reduce((sum, item) => sum + item.paid, 0);
  const unpaid = Math.max(0, actual - paid);
  const remaining = limit - actual;
  return {
    limit, planned, actual, paid, unpaid, remaining,
    count: expenses.length,
    fullyPaidCount: expenses.filter((item) => effectiveCost(item) > 0 && item.paid >= effectiveCost(item)).length,
    overBudget: limit > 0 && actual > limit,
    percentage: limit > 0 ? Math.round((actual / limit) * 100) : 0,
    paidPercentage: actual > 0 ? Math.round((paid / actual) * 100) : 0,
  };
}

export function groupExpensesByCategory(items = []) {
  const groups = new Map();
  items.map(normalizeExpense).forEach((item) => {
    const group = groups.get(item.category) || { category: item.category, estimated: 0, actual: 0, paid: 0, count: 0 };
    group.estimated += item.estimated;
    group.actual += effectiveCost(item);
    group.paid += item.paid;
    group.count += 1;
    groups.set(item.category, group);
  });
  return [...groups.values()].sort((a, b) => b.actual - a.actual);
}

export function filterExpenses(items = [], filters = {}) {
  const query = cleanText(filters.query, 100).toLowerCase();
  const category = filters.category || 'All';
  const payment = filters.payment || 'all';
  const priority = filters.priority || 'all';
  return items.map(normalizeExpense).filter((item) => {
    const haystack = [item.title, item.category, item.vendor, item.notes].join(' ').toLowerCase();
    const cost = effectiveCost(item);
    const matchesPayment = payment === 'all'
      || (payment === 'paid' && cost > 0 && item.paid >= cost)
      || (payment === 'unpaid' && item.paid < cost);
    return (!query || haystack.includes(query))
      && (category === 'All' || item.category === category)
      && (priority === 'all' || item.priority === priority)
      && matchesPayment;
  });
}

export function getUpcomingPayments(items = [], today = new Date()) {
  const todayText = today.toISOString().slice(0, 10);
  return items.map(normalizeExpense)
    .filter((item) => item.dueDate && item.dueDate >= todayText && item.paid < effectiveCost(item))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function exportBudgetReport(items = [], limit = 0, currency = 'INR') {
  const summary = getBudgetSummary(items, limit);
  const money = (value) => `${currency} ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const lines = [
    'WEDDING BUDGET REPORT',
    `Budget limit: ${money(summary.limit)}`,
    `Planned: ${money(summary.planned)}`,
    `Current spend: ${money(summary.actual)}`,
    `Paid: ${money(summary.paid)}`,
    `Outstanding: ${money(summary.unpaid)}`,
    `Remaining: ${money(summary.remaining)}`,
    `Budget used: ${summary.percentage}%`,
    '',
    'EXPENSES',
    'Title | Category | Estimate | Current cost | Paid | Vendor | Due date | Priority',
  ];
  items.map(normalizeExpense).forEach((item) => lines.push([
    item.title, item.category, money(item.estimated), money(effectiveCost(item)),
    money(item.paid), item.vendor || '-', item.dueDate || '-', item.priority,
  ].join(' | ')));
  lines.push('', 'CATEGORY TOTALS');
  groupExpensesByCategory(items).forEach((group) => {
    lines.push(`${group.category}: ${money(group.actual)} current; ${money(group.paid)} paid; ${group.count} items`);
  });
  const upcoming = getUpcomingPayments(items);
  lines.push('', 'UPCOMING PAYMENTS');
  upcoming.forEach((item) => lines.push(`${item.dueDate} — ${item.title}: ${money(Math.max(0, effectiveCost(item) - item.paid))}`));
  return lines.join('\n');
}
