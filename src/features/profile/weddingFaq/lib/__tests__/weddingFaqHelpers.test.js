import {
  faqCategoryLabel,
  normalizeFaq,
  searchFaq,
  sortFaq,
  summarizeFaq,
  validateFaq,
} from '../weddingFaqHelpers';

describe('wedding FAQ helpers', () => {
  it('requires guest-ready questions and answers and valid order', () => {
    expect(validateFaq({ question: '', answer: '', category: 'invalid', order: 0 }).isValid).toBe(false);
    expect(
      validateFaq({ question: 'When does it start?', answer: 'At 4 pm.', category: 'schedule', order: '2' })
        .isValid
    ).toBe(true);
  });

  it('normalizes visibility and order, and searches/sorts preview copy', () => {
    const records = [
      normalizeFaq({
        question: 'Where to stay?',
        answer: 'At the hotel.',
        category: 'accommodations',
        order: '2',
      }),
      normalizeFaq({
        question: 'When to arrive?',
        answer: 'By 3 pm.',
        category: 'schedule',
        order: '1',
        visible: false,
      }),
    ];
    expect(searchFaq(records, 'hotel')).toHaveLength(1);
    expect(sortFaq(records)[0].order).toBe(1);
    expect(summarizeFaq(records)).toEqual({ total: 2, published: 1, categories: 2 });
    expect(faqCategoryLabel('schedule')).toBe('Schedule');
  });
});
