import { isCalendarDate } from '../../keepsakes/lib/keepsakeHelpers';
import {
  MAX_MILESTONE_NOTE,
  MAX_MILESTONE_TITLE,
  MILESTONE_COPY,
  MILESTONE_TYPES,
} from './milestoneConstants';

export function validateMilestone(values = {}) {
  const errors = {};
  const title = typeof values.title === 'string' ? values.title.trim() : '';
  const note = typeof values.note === 'string' ? values.note.trim() : '';
  if (!title) errors.title = MILESTONE_COPY.titleRequired;
  else if (title.length > MAX_MILESTONE_TITLE) errors.title = MILESTONE_COPY.titleTooLong;
  if (!isCalendarDate(values.date)) errors.date = MILESTONE_COPY.invalidDate;
  if (note.length > MAX_MILESTONE_NOTE) errors.note = MILESTONE_COPY.noteTooLong;
  if (!MILESTONE_TYPES.some((type) => type.value === values.type)) errors.type = 'Choose a milestone type.';
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function sortMilestones(items = []) {
  return [...items].sort((a, b) => {
    if (Boolean(a.completed) !== Boolean(b.completed)) return a.completed ? 1 : -1;
    return (a.date ?? '').localeCompare(b.date ?? '');
  });
}

export function summariseMilestones(items = []) {
  const completed = items.filter((item) => item.completed).length;
  return { total: items.length, completed, upcoming: items.length - completed };
}

export function milestoneTypeLabel(value) {
  return MILESTONE_TYPES.find((type) => type.value === value)?.label ?? 'Milestone';
}
