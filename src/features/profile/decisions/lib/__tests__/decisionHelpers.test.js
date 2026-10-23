import {
  decisionCategoryLabel,
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
    expect(summariseDecisions(items)).toEqual({ total: 3, decided: 1, open: 2 });
  });

  it('returns a readable category fallback', () => {
    expect(decisionCategoryLabel('ceremony')).toBe('Ceremony');
    expect(decisionCategoryLabel('unknown')).toBe('Decision');
  });
});
