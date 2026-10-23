import { DOCUMENT_TYPES, MAX_DOCUMENT_NOTE } from './documentConstants';
import { isCalendarDate } from '../../keepsakes/lib/keepsakeHelpers';

export function validateDocument(values = {}) {
  const errors = {};
  if (!DOCUMENT_TYPES.some((item) => item.value === values.type)) {
    errors.type = 'Choose a document type.';
  }
  const title = typeof values.title === 'string' ? values.title.trim() : '';
  if (values.type === 'other' && !title) errors.title = 'Add a name for this document.';
  if (title.length > 80) errors.title = 'Keep the document name under 80 characters.';
  const note = typeof values.note === 'string' ? values.note.trim() : '';
  if (note.length > MAX_DOCUMENT_NOTE) errors.note = `Keep notes under ${MAX_DOCUMENT_NOTE} characters.`;
  const reviewDate = typeof values.reviewDate === 'string' ? values.reviewDate.trim() : '';
  if (reviewDate && !isCalendarDate(reviewDate)) errors.reviewDate = 'Enter a real date as YYYY-MM-DD.';
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function sortDocuments(documents = []) {
  return [...documents].sort((a, b) => {
    if (Boolean(a.completed) !== Boolean(b.completed)) return a.completed ? 1 : -1;
    return (a.reviewDate || '9999-12-31').localeCompare(b.reviewDate || '9999-12-31');
  });
}

export function filterDocuments(documents = [], status = 'all') {
  if (status === 'complete') return documents.filter((document) => Boolean(document.completed));
  if (status === 'open') return documents.filter((document) => !document.completed);
  return [...documents];
}

export function searchDocuments(documents = [], query = '') {
  const term = String(query).trim().toLocaleLowerCase();
  if (!term) return [...documents];
  return documents.filter((document) =>
    [document.title, document.note, documentTypeLabel(document.type), document.reviewDate].some((value) =>
      String(value ?? '')
        .toLocaleLowerCase()
        .includes(term)
    )
  );
}

export function summariseDocuments(documents = []) {
  const completed = documents.filter((document) => document.completed).length;
  return {
    total: documents.length,
    completed,
    remaining: documents.length - completed,
    ratio: documents.length ? completed / documents.length : 0,
  };
}

export function documentTypeLabel(value) {
  return DOCUMENT_TYPES.find((item) => item.value === value)?.label ?? 'Document';
}
