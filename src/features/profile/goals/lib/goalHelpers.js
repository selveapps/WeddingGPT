import { isCalendarDate } from '../../keepsakes/lib/keepsakeHelpers';
import {
  GOAL_CATEGORIES,
  GOAL_COPY,
  GOAL_PRIORITIES,
  MAX_GOAL_DETAILS,
  MAX_GOAL_TITLE,
} from './goalConstants';

export function validateGoal(values = {}) {
  const errors = {};
  const title = typeof values.title === 'string' ? values.title.trim() : '';
  const details = typeof values.details === 'string' ? values.details.trim() : '';
  const dueDate = typeof values.dueDate === 'string' ? values.dueDate.trim() : '';
  if (!title) errors.title = GOAL_COPY.titleRequired;
  else if (title.length > MAX_GOAL_TITLE) errors.title = GOAL_COPY.titleTooLong;
  if (details.length > MAX_GOAL_DETAILS) errors.details = GOAL_COPY.detailsTooLong;
  if (dueDate && !isCalendarDate(dueDate)) errors.dueDate = GOAL_COPY.invalidDate;
  if (!GOAL_CATEGORIES.some((category) => category.value === values.category)) {
    errors.category = 'Choose a goal area.';
  }
  if (!GOAL_PRIORITIES.some((priority) => priority.value === values.priority)) {
    errors.priority = 'Choose a planning pace.';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function sortGoals(goals = []) {
  return [...goals].sort((a, b) => {
    if (Boolean(a.completed) !== Boolean(b.completed)) return a.completed ? 1 : -1;
    const aDate = a.dueDate || '9999-12-31';
    const bDate = b.dueDate || '9999-12-31';
    return aDate.localeCompare(bDate) || (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
  });
}

export function summariseGoals(goals = []) {
  const completed = goals.filter((goal) => goal.completed).length;
  return {
    total: goals.length,
    completed,
    active: goals.length - completed,
    completionPercent: goals.length ? Math.round((completed / goals.length) * 100) : 0,
  };
}

export function goalCategoryLabel(value) {
  return GOAL_CATEGORIES.find((category) => category.value === value)?.label ?? 'Shared goal';
}

export function goalPriorityLabel(value) {
  return GOAL_PRIORITIES.find((priority) => priority.value === value)?.label ?? 'Steady';
}
