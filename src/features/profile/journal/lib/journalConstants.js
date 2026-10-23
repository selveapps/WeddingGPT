export const JOURNAL_FIELD = 'profileJournalEntries';
export const MAX_JOURNAL_TITLE = 80;
export const MAX_JOURNAL_BODY = 1200;
export const JOURNAL_PROMPTS = [
  'What do you want the day to feel like?',
  'What small moment are you most looking forward to?',
  'What would make planning feel easier this week?',
];
export const JOURNAL_COPY = {
  titleRequired: 'Add a short title for this note.',
  titleTooLong: `Keep the title to ${MAX_JOURNAL_TITLE} characters or fewer.`,
  bodyRequired: 'Write a few words before saving.',
  bodyTooLong: `Keep the note to ${MAX_JOURNAL_BODY} characters or fewer.`,
};
