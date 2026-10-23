import { ExpenseCommitment } from './enums';
import { eventName, sortEvents } from './events';
import { toISODate, formatMonthYear } from '../lib/date';
import { toMajor } from '../lib/currency';
import { toCsv } from '../lib/csv';

/**
 * Finance reports (workstream C, slice C4): planned against committed and
 * paid, by category and by event; payments due month by month; and a CSV of
 * all of it for whoever is helping with the money.
 *
 * Amounts are minor units throughout, like the rest of the budget. The terms
 * match `summariseBudget`:
 *  - paid        money that has left the account
 *  - committed   contractually owed and not yet paid
 *  - estimated   a guess, not yet committed and not yet paid
 *  - carried     paid + committed: what the budget is really holding
 */

export const WHOLE_WEDDING = 'Whole wedding';
export const UNCATEGORISED = 'Uncategorised';

/** Paid, committed and estimated amounts for a set of expenses. */
export function moneyFigures(expenses = []) {
  let paid = 0;
  let committed = 0;
  let estimated = 0;
  for (const expense of expenses) {
    const amount = Math.max(0, expense.amount ?? 0);
    const paidPart = Math.min(Math.max(0, expense.paidAmount ?? 0), amount);
    paid += paidPart;
    if (expense.commitment === ExpenseCommitment.COMMITTED) committed += amount - paidPart;
    else estimated += amount - paidPart;
  }
  return { paid, committed, estimated, carried: paid + committed, count: expenses.length };
}

/**
 * One row per budget category, plus "Uncategorised" when some costs have no
 * (or a deleted) category. `overBy` is how far what is carried passes what
 * was planned; `projectedOverBy` adds the estimates.
 */
export function categoryReport(categories = [], expenses = []) {
  const known = new Set(categories.map((category) => category.id));
  const ordered = [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const rows = ordered.map((category) => {
    const figures = moneyFigures(expenses.filter((expense) => expense.budgetCategoryId === category.id));
    return row(category.id, category.name, category.allocated ?? 0, figures);
  });
  const loose = expenses.filter((expense) => !known.has(expense.budgetCategoryId));
  if (loose.length) rows.push(row(null, UNCATEGORISED, 0, moneyFigures(loose)));
  return rows;
}

function row(id, name, planned, figures) {
  return {
    id,
    name,
    planned,
    ...figures,
    overBy: Math.max(0, figures.carried - planned),
    projectedOverBy: Math.max(0, figures.carried + figures.estimated - planned),
  };
}

/** The whole budget in one row: the total against everything. */
export function reportTotals(total = 0, categories = [], expenses = []) {
  const figures = moneyFigures(expenses);
  const allocated = categories.reduce((sum, category) => sum + (category.allocated ?? 0), 0);
  return {
    ...row('total', 'Total', total, figures),
    /** Planned in categories; differs from the total when the split was edited. */
    allocated,
    unallocated: total - allocated,
  };
}

/**
 * One row per event (in event order), then the costs for the wedding as a
 * whole. Events have no budget of their own, so there is no planned figure.
 */
export function eventReport(events = [], expenses = []) {
  const known = new Set(events.map((event) => event.id));
  const rows = sortEvents(events).map((event) => ({
    id: event.id,
    name: eventName(event),
    ...moneyFigures(expenses.filter((expense) => expense.eventId === event.id)),
  }));
  const general = expenses.filter((expense) => !known.has(expense.eventId));
  if (general.length) rows.push({ id: null, name: WHOLE_WEDDING, ...moneyFigures(general) });
  return rows;
}

const monthKey = (iso) => iso.slice(0, 7);
const addMonthsToKey = (key, n) => {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year, month - 1 + n, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

/** What is still to pay on an expense. */
export const stillToPay = (expense) =>
  Math.max(0, (expense.amount ?? 0) - Math.min(expense.paidAmount ?? 0, expense.amount ?? 0));

/**
 * Money still to pay, by the month it is due, for `months` months from this
 * one. Payments with a due date before today are overdue; past the window is
 * "later"; committed money with no due date is "no date yet". Estimates with
 * no due date are left out - they are not payments yet.
 */
export function paymentsDueByMonth(expenses = [], { from = new Date(), months = 12 } = {}) {
  const today = toISODate(from);
  const first = monthKey(today);
  const keys = Array.from({ length: months }, (_, i) => addMonthsToKey(first, i));
  const last = keys.at(-1);
  const bucket = () => ({ total: 0, count: 0, expenses: [] });
  const byMonth = new Map(keys.map((key) => [key, bucket()]));
  const overdue = bucket();
  const later = bucket();
  const undated = bucket();

  for (const expense of expenses) {
    const owed = stillToPay(expense);
    if (!owed) continue;
    let target;
    if (!expense.dueDate) {
      if (expense.commitment !== ExpenseCommitment.COMMITTED) continue;
      target = undated;
    } else if (expense.dueDate < today) target = overdue;
    else if (monthKey(expense.dueDate) > last) target = later;
    else target = byMonth.get(monthKey(expense.dueDate));
    target.total += owed;
    target.count += 1;
    target.expenses.push(expense);
  }

  const byDue = (a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
  for (const entry of [overdue, later, undated, ...byMonth.values()]) entry.expenses.sort(byDue);

  return {
    months: keys.map((key) => ({ month: key, label: formatMonthYear(`${key}-01`), ...byMonth.get(key) })),
    overdue,
    later,
    undated,
    total:
      overdue.total + later.total + undated.total + [...byMonth.values()].reduce((s, m) => s + m.total, 0),
  };
}

/** The busiest month ahead, for a one-line summary. Null when nothing is due. */
export function heaviestMonth(due) {
  return due.months.reduce((best, month) => (month.total > (best?.total ?? 0) ? month : best), null);
}

/**
 * The whole report as one CSV: three sections separated by a blank row.
 * Money is written in major units (1250.5, not 125050) so a spreadsheet can
 * sum it.
 */
export function financeReportCsv({
  total = 0,
  categories = [],
  expenses = [],
  events = [],
  currency,
  from = new Date(),
}) {
  const money = (minor) => toMajor(minor, currency);
  const rows = [[currency ? `Budget report (${currency})` : 'Budget report', toISODate(from)], []];

  rows.push(['By category', 'Planned', 'Paid', 'Committed', 'Estimated', 'Over by']);
  for (const entry of categoryReport(categories, expenses)) {
    rows.push([
      entry.name,
      money(entry.planned),
      money(entry.paid),
      money(entry.committed),
      money(entry.estimated),
      money(entry.overBy),
    ]);
  }
  const totals = reportTotals(total, categories, expenses);
  rows.push([
    'Total',
    money(totals.planned),
    money(totals.paid),
    money(totals.committed),
    money(totals.estimated),
    money(totals.overBy),
  ]);

  const byEvent = eventReport(events, expenses);
  if (events.length) {
    rows.push([], ['By event', 'Paid', 'Committed', 'Estimated', 'Costs']);
    for (const entry of byEvent)
      rows.push([entry.name, money(entry.paid), money(entry.committed), money(entry.estimated), entry.count]);
  }

  const due = paymentsDueByMonth(expenses, { from });
  rows.push([], ['Payments due', 'Amount', 'Payments']);
  if (due.overdue.count) rows.push(['Overdue', money(due.overdue.total), due.overdue.count]);
  for (const month of due.months) rows.push([month.label, money(month.total), month.count]);
  if (due.later.count) rows.push(['Later', money(due.later.total), due.later.count]);
  if (due.undated.count) rows.push(['No date yet', money(due.undated.total), due.undated.count]);

  return toCsv(rows);
}
