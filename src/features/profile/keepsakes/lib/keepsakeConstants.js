export const KEEPSAKE_FIELD = 'profileKeepsakes';
export const KEEPSAKE_CATEGORIES = [
  { value: 'story', label: 'Story' },
  { value: 'inspiration', label: 'Inspiration' },
  { value: 'tradition', label: 'Tradition' },
  { value: 'detail', label: 'Little detail' },
];
export const MAX_KEEPSAKE_TITLE = 80;
export const MAX_KEEPSAKE_NOTE = 500;
export const KEEPSAKE_COPY = {
  titleRequired: 'Give this keepsake a name.',
  titleTooLong: `Use ${MAX_KEEPSAKE_TITLE} characters or fewer for the name.`,
  noteTooLong: `Keep the note to ${MAX_KEEPSAKE_NOTE} characters or fewer.`,
  invalidDate: 'Use a date like 2026-10-23, or leave it blank.',
};
