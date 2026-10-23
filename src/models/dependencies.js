import { TaskStatus } from './enums';

/**
 * Task dependencies (workstream C, slice C2): "Send the invitations" waits for
 * "Build the full guest list".
 *
 * A task lists the tasks it waits for in `waitsFor` (task ids). Waiting is
 * advice, not a lock: a couple can still tick a waiting task off - real life
 * does not always follow the plan - but the task says what it waits for, and
 * the daily checklist leaves it out until its prerequisites are done.
 *
 * Cycles are refused when a link is added. Two partners editing at once can
 * still create one through sync, so everything here also copes with cycles
 * rather than looping forever.
 */

export const DEPENDENCY_LIMITS = {
  /** Prerequisites per task. More than this is a project plan, not a checklist. */
  perTask: 10,
};

const isTaskOpen = (task) => task?.status !== TaskStatus.DONE && task?.status !== TaskStatus.SKIPPED;

const byIdOf = (tasks) => (tasks instanceof Map ? tasks : new Map(tasks.map((task) => [task.id, task])));

/** The prerequisites of a task that still exist, open or not. */
export function prerequisitesOf(task, tasks = []) {
  const byId = byIdOf(tasks);
  return (task?.waitsFor ?? []).map((id) => byId.get(id)).filter(Boolean);
}

/**
 * The prerequisites still to do. A deleted prerequisite no longer blocks, and
 * nor does a skipped one: the couple decided it is not happening.
 * `assumeDone` is a set of ids to treat as finished (for planning ahead).
 */
export function openPrerequisites(task, tasks = [], assumeDone = null) {
  return prerequisitesOf(task, tasks).filter((prereq) => isTaskOpen(prereq) && !assumeDone?.has(prereq.id));
}

export function isTaskWaiting(task, tasks = [], assumeDone = null) {
  return isTaskOpen(task) && openPrerequisites(task, tasks, assumeDone).length > 0;
}

/** Tasks that wait for this one. */
export function dependentsOf(taskId, tasks = []) {
  const list = tasks instanceof Map ? [...tasks.values()] : tasks;
  return list.filter((task) => (task.waitsFor ?? []).includes(taskId));
}

/** True if `fromId` reaches `toId` by following `waitsFor` links. */
function reaches(fromId, toId, byId) {
  const seen = new Set();
  const stack = [fromId];
  while (stack.length) {
    const id = stack.pop();
    if (id === toId) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const next of byId.get(id)?.waitsFor ?? []) stack.push(next);
  }
  return false;
}

/**
 * Why `taskId` cannot wait for `prerequisiteId`, or null if it can. A link
 * that would close a loop is refused: two tasks each waiting for the other
 * would never be ready.
 */
export function dependencyError(taskId, prerequisiteId, tasks = []) {
  const byId = byIdOf(tasks);
  const task = byId.get(taskId);
  if (!task || !byId.has(prerequisiteId)) return 'That task no longer exists.';
  if (taskId === prerequisiteId) return 'A task cannot wait for itself.';
  if ((task.waitsFor ?? []).includes(prerequisiteId)) return 'It already waits for that.';
  if ((task.waitsFor ?? []).length >= DEPENDENCY_LIMITS.perTask)
    return `A task can wait for up to ${DEPENDENCY_LIMITS.perTask} others.`;
  if (reaches(prerequisiteId, taskId, byId)) return 'That task already waits for this one.';
  return null;
}

/** Remove links to tasks that are gone. Returns the tasks that changed, as `{ id, waitsFor }`. */
export function pruneDependencies(tasks = [], removedIds = []) {
  const removed = new Set(removedIds);
  return tasks
    .filter((task) => (task.waitsFor ?? []).some((id) => removed.has(id)))
    .map((task) => ({ id: task.id, waitsFor: task.waitsFor.filter((id) => !removed.has(id)) }));
}

/**
 * The obvious dependencies in the generated plan, by template title. Only
 * links where both tasks are in the plan are made, so a short plan that
 * dropped "Shortlist venues" does not leave "Book the reception venue" waiting
 * for nothing.
 */
export const TEMPLATE_DEPENDENCIES = {
  'Visit your shortlist': ['Shortlist venues'],
  'Book the ceremony venue': ['Visit your shortlist', 'Choose your date or window'],
  'Book the reception venue': ['Visit your shortlist', 'Choose your date or window'],
  'Confirm the venue timeline': ['Book the reception venue'],
  'Send the venue your final numbers': ['Chase outstanding RSVPs'],
  'Book catering': ['Book the reception venue', 'Draft a rough guest count'],
  'Confirm every vendor in writing': ['Book your photographer', 'Book catering'],
  'Share the running order with all vendors': ['Agree the day-of running order'],
  'Collect addresses and contact details': ['Build the full guest list'],
  'Send save the dates': ['Choose your date or window', 'Collect addresses and contact details'],
  'Send the invitations': ['Build the full guest list', 'Book the ceremony venue'],
  'Chase outstanding RSVPs': ['Send the invitations'],
  'Finalise the seating plan': ['Chase outstanding RSVPs'],
  'Order your outfits': ['Start looking at outfits'],
  'Book your fittings': ['Order your outfits'],
  'Final fitting': ['Book your fittings'],
  'Split the budget across categories': ['Set a realistic total budget'],
  'Set up a payment schedule': ['Split the budget across categories'],
  'Settle the final balances': ['Set up a payment schedule'],
  'Give notice or file the paperwork': ['Check the legal requirements'],
  'Gather the documents for the day': ['Give notice or file the paperwork'],
};

/** Fill `waitsFor` on freshly generated plan tasks from `TEMPLATE_DEPENDENCIES`. */
export function linkTemplateDependencies(tasks = []) {
  const idByTitle = new Map(tasks.map((task) => [task.title, task.id]));
  return tasks.map((task) => {
    const waitsFor = (TEMPLATE_DEPENDENCIES[task.title] ?? [])
      .map((title) => idByTitle.get(title))
      .filter(Boolean);
    return waitsFor.length ? { ...task, waitsFor } : task;
  });
}
