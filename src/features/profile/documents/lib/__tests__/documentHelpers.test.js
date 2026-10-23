import {
  filterDocuments,
  filterDocumentsByType,
  isDocumentReviewOverdue,
  searchDocuments,
  sortDocuments,
  summariseDocuments,
  validateDocument,
} from '../documentHelpers';

describe('wedding document checklist helpers', () => {
  it('validates custom names and review dates', () => {
    expect(validateDocument({ type: 'venue' }).isValid).toBe(true);
    expect(validateDocument({ type: 'other' }).errors.title).toBeTruthy();
    expect(validateDocument({ type: 'venue', reviewDate: '2026-02-30' }).errors.reviewDate).toBeTruthy();
  });

  it('puts incomplete and sooner-due records first', () => {
    const items = [
      { completed: true, reviewDate: '' },
      { completed: false, reviewDate: '2026-12-01' },
      { completed: false, reviewDate: '2026-11-01' },
    ];
    expect(sortDocuments(items)).toEqual([items[2], items[1], items[0]]);
  });

  it('summarises an empty checklist safely', () => {
    expect(summariseDocuments([])).toEqual({
      total: 0,
      completed: 0,
      remaining: 0,
      ratio: 0,
      overdue: 0,
    });
  });

  it('filters incomplete and completed paperwork without changing the checklist', () => {
    const items = [{ completed: false }, { completed: true }];
    expect(filterDocuments(items, 'open')).toEqual([items[0]]);
    expect(filterDocuments(items, 'complete')).toEqual([items[1]]);
    expect(filterDocuments(items)).toEqual(items);
  });

  it('filters checklist entries by document type', () => {
    const items = [{ type: 'venue' }, { type: 'insurance' }];
    expect(filterDocumentsByType(items, 'venue')).toEqual([items[0]]);
    expect(filterDocumentsByType(items)).toEqual(items);
  });

  it('searches document titles, notes, dates, and readable types', () => {
    const rows = [
      { type: 'venue', title: '', note: 'Call Alex', reviewDate: '2026-11-01' },
      { type: 'insurance', title: 'Policy renewal', note: '', reviewDate: '2027-01-01' },
    ];
    expect(searchDocuments(rows, 'venue')).toEqual([rows[0]]);
    expect(searchDocuments(rows, 'Alex')).toEqual([rows[0]]);
    expect(searchDocuments(rows, '2027')).toEqual([rows[1]]);
    expect(searchDocuments(rows, '')).toEqual(rows);
  });

  it('counts past review dates only for incomplete paperwork', () => {
    const now = new Date(2026, 9, 23, 12);
    const overdue = { completed: false, reviewDate: '2026-10-20' };
    const completed = { completed: true, reviewDate: '2026-10-20' };
    expect(isDocumentReviewOverdue(overdue, now)).toBe(true);
    expect(isDocumentReviewOverdue(completed, now)).toBe(false);
    expect(isDocumentReviewOverdue({ completed: false, reviewDate: 'invalid' }, now)).toBe(false);
    expect(summariseDocuments([overdue, completed], now).overdue).toBe(1);
  });
});
