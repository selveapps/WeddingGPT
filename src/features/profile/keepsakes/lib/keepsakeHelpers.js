import {
  KEEPSAKE_CATEGORIES,
  KEEPSAKE_COPY,
  MAX_KEEPSAKE_NOTE,
  MAX_KEEPSAKE_TITLE,
} from './keepsakeConstants';

export function isCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validateKeepsake(values = {}) {
  const errors = {};
  const title = typeof values.title === 'string' ? values.title.trim() : '';
  const note = typeof values.note === 'string' ? values.note.trim() : '';
  const date = typeof values.date === 'string' ? values.date.trim() : '';
  if (!title) errors.title = KEEPSAKE_COPY.titleRequired;
  else if (title.length > MAX_KEEPSAKE_TITLE) errors.title = KEEPSAKE_COPY.titleTooLong;
  if (note.length > MAX_KEEPSAKE_NOTE) errors.note = KEEPSAKE_COPY.noteTooLong;
  if (date && !isCalendarDate(date)) errors.date = KEEPSAKE_COPY.invalidDate;
  if (!KEEPSAKE_CATEGORIES.some((category) => category.value === values.category))
    errors.category = 'Choose a keepsake type.';
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function sortKeepsakes(items = []) {
  return [...items].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

export function keepsakeCategoryLabel(value) {
  return KEEPSAKE_CATEGORIES.find((category) => category.value === value)?.label ?? 'Keepsake';
}
