import {
  DECISION_CATEGORIES,
  DECISION_STATUSES,
  MAX_DECISION_NOTE,
  MAX_DECISION_OPTIONS,
  MAX_DECISION_QUESTION,
} from './decisionConstants';
import { isCalendarDate } from '../../keepsakes/lib/keepsakeHelpers';

export function parseDecisionOptions(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
  }
  if (typeof value !== 'string') return [];
  return [
    ...new Set(
      value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ];
}

export function validateDecision(values = {}) {
  const errors = {};
  const question = typeof values.question === 'string' ? values.question.trim() : '';
  const note = typeof values.note === 'string' ? values.note.trim() : '';
  const options = parseDecisionOptions(values.options);
  const revisitDate = typeof values.revisitDate === 'string' ? values.revisitDate.trim() : '';
  if (!question) errors.question = 'Write down the decision you need to make.';
  else if (question.length > MAX_DECISION_QUESTION)
    errors.question = `Use ${MAX_DECISION_QUESTION} characters or fewer.`;
  if (options.length < 2) errors.options = 'Add at least two different options to compare.';
  else if (options.length > MAX_DECISION_OPTIONS)
    errors.options = `Compare up to ${MAX_DECISION_OPTIONS} options.`;
  if (note.length > MAX_DECISION_NOTE) errors.note = `Keep notes under ${MAX_DECISION_NOTE} characters.`;
  if (revisitDate && !isCalendarDate(revisitDate)) errors.revisitDate = 'Enter a real date as YYYY-MM-DD.';
  if (!DECISION_CATEGORIES.some((item) => item.value === values.category))
    errors.category = 'Choose a decision area.';
  if (!options.includes(values.selectedOption ?? '') && values.selectedOption) {
    errors.selectedOption = 'Choose one of the options you listed.';
  }
  return { isValid: Object.keys(errors).length === 0, errors, options };
}

export function sortDecisions(items = []) {
  return [...items].sort((a, b) => {
    if (a.status !== b.status) return a.status === DECISION_STATUSES.OPEN ? -1 : 1;
    const aDate = a.revisitDate || '9999-12-31';
    const bDate = b.revisitDate || '9999-12-31';
    return aDate.localeCompare(bDate) || (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
  });
}

export function summariseDecisions(items = []) {
  const decided = items.filter((item) => item.status === DECISION_STATUSES.DECIDED).length;
  return { total: items.length, decided, open: items.length - decided };
}

export function decisionCategoryLabel(value) {
  return DECISION_CATEGORIES.find((item) => item.value === value)?.label ?? 'Decision';
}
