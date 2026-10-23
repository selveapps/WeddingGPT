export const GOAL_FIELD = 'profileCoupleGoals';
export const GOAL_PRIORITIES = [
  { value: 'soon', label: 'Soon' },
  { value: 'steady', label: 'Steady' },
  { value: 'someday', label: 'Someday' },
];
export const GOAL_CATEGORIES = [
  { value: 'planning', label: 'Planning' },
  { value: 'together', label: 'Time together' },
  { value: 'celebration', label: 'Celebration' },
];
export const MAX_GOAL_TITLE = 90;
export const MAX_GOAL_DETAILS = 500;
export const GOAL_COPY = {
  titleRequired: 'Give this shared goal a clear name.',
  titleTooLong: `Use ${MAX_GOAL_TITLE} characters or fewer.`,
  detailsTooLong: `Keep the details to ${MAX_GOAL_DETAILS} characters or fewer.`,
  invalidDate: 'Use a real date in YYYY-MM-DD format, or leave the date blank.',
};
