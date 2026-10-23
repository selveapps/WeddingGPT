import { JOURNAL_COPY, MAX_JOURNAL_BODY, MAX_JOURNAL_TITLE } from './journalConstants';

export function validateJournalEntry(values = {}) {
  const errors = {};
  const title = typeof values.title === 'string' ? values.title.trim() : '';
  const body = typeof values.body === 'string' ? values.body.trim() : '';
  if (!title) errors.title = JOURNAL_COPY.titleRequired;
  else if (title.length > MAX_JOURNAL_TITLE) errors.title = JOURNAL_COPY.titleTooLong;
  if (!body) errors.body = JOURNAL_COPY.bodyRequired;
  else if (body.length > MAX_JOURNAL_BODY) errors.body = JOURNAL_COPY.bodyTooLong;
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function sortJournalEntries(entries = []) {
  return [...entries].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

export function formatJournalDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Saved note'
    : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
