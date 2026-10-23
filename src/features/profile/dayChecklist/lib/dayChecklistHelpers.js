import { DAY_CHECKLIST_CATEGORIES, DAY_CHECKLIST_PRIORITIES } from './dayChecklistConstants';

export function checklistTimeToMinutes(value) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim())) return null;
  const [hours, minutes] = value.trim().split(':').map(Number);
  return hours * 60 + minutes;
}

export function validateDayChecklistTask(values = {}) {
  const errors = {};
  const title = typeof values.title === 'string' ? values.title.trim() : '';
  const owner = typeof values.owner === 'string' ? values.owner.trim() : '';
  const note = typeof values.note === 'string' ? values.note.trim() : '';
  const time = typeof values.time === 'string' ? values.time.trim() : '';

  if (!title) errors.title = 'Add a task name.';
  else if (title.length > 90) errors.title = 'Keep task names under 90 characters.';
  if (time && checklistTimeToMinutes(time) === null) {
    errors.time = 'Enter a time from 00:00 to 23:59.';
  }
  if (owner.length > 70) errors.owner = 'Keep the owner under 70 characters.';
  if (note.length > 240) errors.note = 'Keep notes under 240 characters.';
  if (!DAY_CHECKLIST_CATEGORIES.some((category) => category.value === values.category)) {
    errors.category = 'Choose a checklist area.';
  }
  if (!DAY_CHECKLIST_PRIORITIES.some((priority) => priority.value === values.priority)) {
    errors.priority = 'Choose a priority.';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function sortDayChecklistTasks(tasks = []) {
  const categoryOrder = new Map(DAY_CHECKLIST_CATEGORIES.map((category, index) => [category.value, index]));
  const priorityOrder = { high: 0, normal: 1, low: 2 };

  return [...tasks].sort((a, b) => {
    if (Boolean(a.completed) !== Boolean(b.completed)) return a.completed ? 1 : -1;
    const aCategory = categoryOrder.get(a.category) ?? DAY_CHECKLIST_CATEGORIES.length;
    const bCategory = categoryOrder.get(b.category) ?? DAY_CHECKLIST_CATEGORIES.length;
    if (aCategory !== bCategory) return aCategory - bCategory;
    const aTime = checklistTimeToMinutes(a.time);
    const bTime = checklistTimeToMinutes(b.time);
    if (aTime !== null || bTime !== null) {
      if (aTime === null) return 1;
      if (bTime === null) return -1;
      if (aTime !== bTime) return aTime - bTime;
    }
    const priorityDifference = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
    return priorityDifference || (a.title ?? '').localeCompare(b.title ?? '');
  });
}

export function summariseDayChecklist(tasks = []) {
  const completed = tasks.filter((task) => task.completed).length;
  const total = tasks.length;
  return {
    total,
    completed,
    remaining: total - completed,
    completionPercent: total ? Math.round((completed / total) * 100) : 0,
  };
}

export function filterDayChecklistTasks(tasks, { status = 'all', category = 'all', query = '' } = {}) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return sortDayChecklistTasks(tasks).filter((task) => {
    if (status === 'open' && task.completed) return false;
    if (status === 'done' && !task.completed) return false;
    if (category !== 'all' && task.category !== category) return false;
    if (!normalizedQuery) return true;
    return [task.title, task.owner, task.note].some((value) =>
      value?.toLocaleLowerCase().includes(normalizedQuery)
    );
  });
}

export function dayChecklistCategoryLabel(value) {
  return DAY_CHECKLIST_CATEGORIES.find((category) => category.value === value)?.label ?? 'Other';
}
