import {
  decisionCategoryLabel,
  filterDecisions,
  filterDecisionsByCategory,
  filterOverdueDecisions,
  isDecisionOverdue,
  searchDecisions,
  parseDecisionOptions,
  sortDecisions,
  summariseDecisions,
  validateDecision,
} from '../decisionHelpers';

const decision = {
  question: 'Which ceremony reading?',
  category: 'ceremony',
  options: 'Poem\nLetter\nPoem',
  note: '',
  revisitDate: '',
};

describe('wedding decision helpers', () => {
  it('parses unique non-empty options and validates a decision', () => {
    expect(parseDecisionOptions(decision.options)).toEqual(['Poem', 'Letter']);
    expect(validateDecision(decision).isValid).toBe(true);
    expect(validateDecision({ ...decision, options: 'Only one' }).errors.options).toBeTruthy();
  });

  it('validates dates and chosen options against the decision list', () => {
    expect(validateDecision({ ...decision, revisitDate: '2026-02-30' }).errors.revisitDate).toBeTruthy();
    expect(validateDecision({ ...decision, selectedOption: 'Cake' }).errors.selectedOption).toBeTruthy();
  });

  it('sorts open questions first and provides a progress summary', () => {
    const items = [
      { status: 'decided', revisitDate: '' },
      { status: 'open', revisitDate: '2026-12-01' },
      { status: 'open', revisitDate: '2026-11-01' },
    ];
    expect(sortDecisions(items)).toEqual([items[2], items[1], items[0]]);
    expect(summariseDecisions(items)).toEqual({ total: 3, decided: 1, open: 2, overdue: 0 });
  });

  it('filters open and decided records without mutating the decision log', () => {
    const items = [{ status: 'open' }, { status: 'decided' }];
    expect(filterDecisions(items, 'open')).toEqual([items[0]]);
    expect(filterDecisions(items, 'decided')).toEqual([items[1]]);
    expect(filterDecisions(items)).toEqual(items);
  });

  it('searches decision questions, notes, options, and chosen option', () => {
    const items = [
      {
        question: 'Pick a reading',
        note: 'Family story',
        options: ['Poem', 'Letter'],
        selectedOption: 'Letter',
      },
      { question: 'Choose cake', note: '', options: ['Chocolate', 'Vanilla'] },
    ];
    expect(searchDecisions(items, 'FAMILY')).toEqual([items[0]]);
    expect(searchDecisions(items, 'vanilla')).toEqual([items[1]]);
    expect(searchDecisions(items, '  ')).toEqual(items);
  });

  it('filters decisions by category without changing their order', () => {
    const items = [{ category: 'ceremony' }, { category: 'style' }, { category: 'ceremony' }];
    expect(filterDecisionsByCategory(items, 'ceremony')).toEqual([items[0], items[2]]);
    expect(filterDecisionsByCategory(items)).toEqual(items);
  });

  it('marks only past-due open decisions as overdue', () => {
    const now = new Date(2026, 9, 23, 12);
    const overdue = { status: 'open', revisitDate: '2026-10-22' };
    const today = { status: 'open', revisitDate: '2026-10-23' };
    const decided = { status: 'decided', revisitDate: '2026-10-01' };
    expect(isDecisionOverdue(overdue, now)).toBe(true);
    expect(isDecisionOverdue(today, now)).toBe(false);
    expect(isDecisionOverdue(decided, now)).toBe(false);
    expect(filterOverdueDecisions([overdue, today, decided], now)).toEqual([overdue]);
  });

  it('returns a readable category fallback', () => {
    expect(decisionCategoryLabel('ceremony')).toBe('Ceremony');
    expect(decisionCategoryLabel('unknown')).toBe('Decision');
  });
});
