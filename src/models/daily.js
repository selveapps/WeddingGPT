import { TaskPriority } from './enums';
import { isTaskOpen, isSnoozeActive } from './planning';
import { isTaskWaiting } from './dependencies';
import { daysUntil } from '../lib/date';

/**
 * The daily checklist: a short, doable list of plan tasks for today.
 *
 * A two-hundred-item plan is paralysing; three things for today is not. The
 * list is picked once each morning (see `planningStore.today`) and then held
 * for the day, so ticking something off leaves it on the list, checked, rather
 * than swapping a new task in under the couple's thumb.
 *
 * Picking order: anything overdue (oldest first), then what is due in the next
 * two weeks (soonest first), then high priority, then everything else by due
 * date, with undated tasks last. Snoozed tasks wait until their snooze ends,
 * and tasks waiting for others until those are done.
 */

export const DAILY_CHECKLIST_SIZE = 3;
const SOON_DAYS = 14;

function rank(task, from) {
  const days = task.dueDate ? daysUntil(task.dueDate, from) : null;
  if (days !== null && days < 0) return [0, days];
  if (days !== null && days <= SOON_DAYS) return [1, days];
  if (task.priority === TaskPriority.HIGH) return [2, days ?? Number.MAX_SAFE_INTEGER];
  if (days !== null) return [3, days];
  return [4, -(task.monthsBefore ?? 0)];
}

/**
 * Today's tasks, most pressing first. `exclude` is a list of task ids to skip;
 * `assumeDone` ids count as finished when deciding what is still waiting.
 */
export function pickDailyTasks(
  tasks = [],
  { from = new Date(), size = DAILY_CHECKLIST_SIZE, exclude = [], assumeDone = [] } = {}
) {
  const skip = new Set(exclude);
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const finished = new Set(assumeDone);
  return tasks
    .filter(
      (task) =>
        isTaskOpen(task) &&
        !isSnoozeActive(task, from) &&
        !skip.has(task.id) &&
        !isTaskWaiting(task, byId, finished)
    )
    .map((task) => ({ task, key: rank(task, from) }))
    .sort((a, b) => a.key[0] - b.key[0] || a.key[1] - b.key[1])
    .slice(0, size)
    .map(({ task }) => task);
}

/**
 * The checklists for the coming days, for morning notifications. Assumes each
 * day's list gets done, so tomorrow's notification names the next tasks rather
 * than repeating today's. The schedule is rebuilt whenever the plan changes or
 * the app opens, so if a list is not done it simply comes round again.
 *
 * Returns `[{ date, tasks }]`, one entry per day that has something on it.
 * `firstDay` lets today's entry reuse the list already shown in the app.
 */
export function planDailyChecklists(tasks = [], { from = new Date(), days = 14, firstDay = null } = {}) {
  const plan = [];
  const used = [];

  for (let offset = 0; offset < days; offset++) {
    const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset);
    const picked =
      offset === 0 && firstDay
        ? firstDay.filter((task) => isTaskOpen(task))
        : pickDailyTasks(tasks, { from: date, exclude: used, assumeDone: used });
    if (picked.length === 0) continue;
    used.push(...picked.map((task) => task.id));
    plan.push({ date, tasks: picked });
  }

  return plan;
}

/** "Book the venue, Order invitations and 1 more" - for notification bodies. */
export function summariseDailyTasks(tasks = []) {
  const titles = tasks.map((task) => task.title).filter(Boolean);
  if (titles.length === 0) return '';
  if (titles.length === 1) return titles[0];
  if (titles.length === 2) return `${titles[0]} and ${titles[1]}`;
  return `${titles[0]}, ${titles[1]} and ${titles.length - 2} more`;
}
