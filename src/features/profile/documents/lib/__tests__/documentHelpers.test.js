import { filterDocuments, sortDocuments, summariseDocuments, validateDocument } from '../documentHelpers';

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
    expect(summariseDocuments([])).toEqual({ total: 0, completed: 0, remaining: 0, ratio: 0 });
  });

  it('filters incomplete and completed paperwork without changing the checklist', () => {
    const items = [{ completed: false }, { completed: true }];
    expect(filterDocuments(items, 'open')).toEqual([items[0]]);
    expect(filterDocuments(items, 'complete')).toEqual([items[1]]);
    expect(filterDocuments(items)).toEqual(items);
  });
});
