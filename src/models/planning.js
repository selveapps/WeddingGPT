import { createEntity } from './base';
import { TaskStatus, TaskPriority, Assignee } from './enums';
import { daysUntil } from '../lib/date';
import { isTaskWaiting } from './dependencies';

/**
 * Tasks and task categories.
 *
 * A task's `dueDate` is an ISO date string, and "overdue" is computed rather
 * than stored - a stored flag would be wrong the moment the clock passed
 * midnight with the app closed.
 *
 * Snoozing sets `snoozedUntil` and moves the status to SNOOZED. The task keeps
 * its original due date, so un-snoozing restores the real deadline instead of
 * quietly rewriting the plan.
 */

/** The default category set generated for a new wedding. */
export const DEFAULT_TASK_CATEGORIES = [
  { key: 'foundations', name: 'Foundations', icon: 'rings' },
  { key: 'venue', name: 'Venue', icon: 'location' },
  { key: 'vendors', name: 'Vendors', icon: 'vendors' },
  { key: 'guests', name: 'Guests', icon: 'guests' },
  { key: 'attire', name: 'Attire and beauty', icon: 'star' },
  { key: 'budget', name: 'Budget', icon: 'budget' },
  { key: 'paperwork', name: 'Paperwork', icon: 'note' },
  { key: 'details', name: 'Details and decor', icon: 'vision' },
  { key: 'week_of', name: 'The week of', icon: 'calendar' },
];

export function createTaskCategory({ weddingId, key = null, name, icon = 'checklist', order = 0 } = {}) {
  return createEntity('tcat', { weddingId, key, name, icon, order });
}

export function createTask({
  weddingId,
  categoryId = null,
  title,
  description = '',
  dueDate = null,
  status = TaskStatus.TODO,
  priority = TaskPriority.NORMAL,
  assignee = Assignee.UNASSIGNED,
  notes = '',
  /** True for tasks the app generated, false for ones the couple typed. */
  isSystemGenerated = false,
  /** Months-before-wedding this task is normally done. Drives plan generation. */
  monthsBefore = null,
  /** The event this task is for, or null for the wedding as a whole. */
  eventId = null,
  /** Ids of the tasks this one waits for (slice C2). */
  waitsFor = [],
  /** The event checklist entry this task came from, e.g. "mehndi:artist" (slice C3). */
  templateKey = null,
} = {}) {
  return createEntity('task', {
    weddingId,
    categoryId,
    title,
    description,
    dueDate,
    status,
    priority,
    assignee,
    notes,
    isSystemGenerated,
    eventId,
    waitsFor,
    templateKey,
    monthsBefore,
    completedAt: null,
    snoozedUntil: null,
  });
}

/** A task is overdue if it has a past due date and is not finished or snoozed. */
export function isTaskOverdue(task, from = new Date()) {
  if (!task?.dueDate) return false;
  if (task.status === TaskStatus.DONE || task.status === TaskStatus.SKIPPED) return false;
  if (task.status === TaskStatus.SNOOZED && task.snoozedUntil) {
    if (daysUntil(task.snoozedUntil, from) > 0) return false;
  }
  return daysUntil(task.dueDate, from) < 0;
}

export function isTaskOpen(task) {
  return task?.status !== TaskStatus.DONE && task?.status !== TaskStatus.SKIPPED;
}

/**
 * A snooze has lapsed once its date arrives - the task quietly becomes active
 * again rather than staying hidden until the user opens the snooze filter.
 */
export function isSnoozeActive(task, from = new Date()) {
  if (task?.status !== TaskStatus.SNOOZED || !task.snoozedUntil) return false;
  return daysUntil(task.snoozedUntil, from) > 0;
}

/**
 * Overall planning progress, 0-1.
 * Skipped tasks are excluded from both sides: a task the couple decided not to
 * do should neither count against them nor inflate the figure.
 */
export function calculateProgress(tasks = []) {
  const relevant = tasks.filter((t) => t.status !== TaskStatus.SKIPPED);
  if (relevant.length === 0) return 0;
  const done = relevant.filter((t) => t.status === TaskStatus.DONE).length;
  return done / relevant.length;
}

/**
 * Pick the single "next best action".
 *
 * Ordering intent, highest first: overdue work, then high-priority work due
 * soon, then whatever is due soonest. Tasks with no due date sort last - they
 * are real, but they are never the most urgent thing on a given morning.
 * Tasks still waiting for others are never the next thing to do.
 */
export function selectNextBestAction(tasks = [], from = new Date()) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const candidates = tasks.filter(
    (t) => isTaskOpen(t) && !isSnoozeActive(t, from) && !isTaskWaiting(t, byId)
  );
  if (candidates.length === 0) return null;

  const score = (task) => {
    const days = task.dueDate ? daysUntil(task.dueDate, from) : Number.MAX_SAFE_INTEGER;
    const overdue = days < 0 ? -10000 : 0;
    const priorityBoost = task.priority === TaskPriority.HIGH ? -200 : 0;
    return overdue + priorityBoost + days;
  };

  return [...candidates].sort((a, b) => score(a) - score(b))[0];
}

/** Open tasks due within `withinDays`, soonest first. Feeds the deadlines card. */
export function selectUpcomingDeadlines(tasks = [], withinDays = 30, from = new Date()) {
  return tasks
    .filter((task) => {
      if (!isTaskOpen(task) || !task.dueDate) return false;
      if (isSnoozeActive(task, from)) return false;
      const days = daysUntil(task.dueDate, from);
      return days !== null && days <= withinDays;
    })
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0));
}
