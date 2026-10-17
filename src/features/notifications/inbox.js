import { isTaskOpen, isTaskOverdue, hasExactDate, summariseDailyTasks } from '@/models';
import { daysUntil, formatRelativeDay, toISODate } from '@/lib/date';
import { formatMoney } from '@/lib/currency';
import { Routes } from '@/navigation/routes';

/**
 * The in-app notification feed: what is coming up and needs doing.
 *
 * Derived from the workspace on every render rather than stored, so it can
 * never disagree with the plan - tick a task off and its item is simply gone.
 * Only "read" is stored (by item id, in notificationStore). Ids include the due
 * date, so a task that is moved to a new date shows up as new again.
 *
 * Each item: `{ id, kind, title, body, url, icon, tone, days }`, most pressing
 * first - anything overdue, then everything else by how soon it is.
 */

/** How far ahead each kind of item looks. */
const TASK_WINDOW_DAYS = 7;
const PAYMENT_WINDOW_DAYS = 14;
const MILESTONE_DAYS = [365, 180, 100, 60, 30, 14];
const MAX_ITEMS = 30;

export function buildInbox({ wedding, tasks = [], expenses = [], today = null, now = new Date() }) {
  const items = [];

  // Today's checklist, while anything on it is still open.
  const todayISO = toISODate(now);
  if (today?.date === todayISO) {
    const open = today.taskIds
      .map((id) => tasks.find((task) => task.id === id))
      .filter((task) => task && isTaskOpen(task));
    if (open.length > 0) {
      items.push({
        id: `daily-${todayISO}`,
        kind: 'daily',
        title: `Today's checklist: ${open.length} left`,
        body: summariseDailyTasks(open),
        url: Routes.home,
        icon: 'checklist',
        tone: 'success',
        days: 0,
      });
    }
  }

  for (const task of tasks) {
    if (!isTaskOpen(task) || !task.dueDate) continue;
    const days = daysUntil(task.dueDate, now);
    if (isTaskOverdue(task, now)) {
      items.push({
        id: `task-overdue-${task.id}-${task.dueDate}`,
        kind: 'overdue',
        title: task.title,
        body: formatRelativeDay(task.dueDate, now),
        url: Routes.taskDetail(task.id),
        icon: 'alert',
        tone: 'danger',
        days,
      });
    } else if (days >= 0 && days <= TASK_WINDOW_DAYS) {
      items.push({
        id: `task-due-${task.id}-${task.dueDate}`,
        kind: 'task',
        title: task.title,
        body: `Due ${formatRelativeDay(task.dueDate, now).toLowerCase()}`,
        url: Routes.taskDetail(task.id),
        icon: 'checklist',
        tone: 'brand',
        days,
      });
    }
  }

  for (const expense of expenses) {
    const outstanding = (expense.amount ?? 0) - (expense.paidAmount ?? 0);
    if (!expense.dueDate || outstanding <= 0) continue;
    const days = daysUntil(expense.dueDate, now);
    if (days > PAYMENT_WINDOW_DAYS) continue;
    items.push({
      id: `payment-${expense.id}-${expense.dueDate}`,
      kind: days < 0 ? 'overdue' : 'payment',
      title: `Pay ${expense.vendorName || expense.title}`,
      body: `${formatMoney(outstanding, wedding?.currency)} · ${formatRelativeDay(expense.dueDate, now)}`,
      url: Routes.expenseDetail(expense.id),
      icon: 'budget',
      tone: days < 0 ? 'danger' : 'warning',
      days,
    });
  }

  if (wedding?.date && hasExactDate(wedding)) {
    const days = daysUntil(wedding.date, now);
    if (days !== null && days >= 0 && (days <= 7 || MILESTONE_DAYS.includes(days))) {
      items.push({
        id: `milestone-${wedding.date}-${days}`,
        kind: 'milestone',
        title: days === 0 ? 'Today is the day!' : days === 1 ? 'Tomorrow is the day!' : `${days} days to go`,
        body: days <= 1 ? 'You are ready. Enjoy it.' : 'A countdown moment worth marking.',
        url: Routes.countdown,
        icon: 'heart',
        tone: 'accent',
        days,
      });
    }
  }

  const rank = (item) => (item.kind === 'overdue' ? 0 : 1);
  return items.sort((a, b) => rank(a) - rank(b) || a.days - b.days).slice(0, MAX_ITEMS);
}
