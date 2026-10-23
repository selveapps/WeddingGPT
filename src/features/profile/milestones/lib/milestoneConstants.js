export const MILESTONE_FIELD = 'profileMilestones';
export const MILESTONE_TYPES = [
  { value: 'relationship', label: 'Relationship' },
  { value: 'planning', label: 'Planning' },
  { value: 'celebration', label: 'Celebration' },
];
export const MAX_MILESTONE_TITLE = 90;
export const MAX_MILESTONE_NOTE = 400;
export const MILESTONE_COPY = {
  titleRequired: 'Name the milestone you want to remember.',
  invalidDate: 'Choose a real date in YYYY-MM-DD format.',
  titleTooLong: `Use ${MAX_MILESTONE_TITLE} characters or fewer.`,
  noteTooLong: `Keep the note to ${MAX_MILESTONE_NOTE} characters or fewer.`,
};
