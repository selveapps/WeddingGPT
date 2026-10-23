import {
  filterVisionIdeas,
  normaliseVisionTags,
  searchVisionIdeas,
  sortVisionIdeas,
  summariseVision,
  validateVisionIdea,
} from '../visionHelpers';

const ideas = [
  { title: 'Garden lights', category: 'decor', moods: ['romantic', 'nature-inspired'], saved: true },
  { title: 'Bright tablecloths', category: 'palette', moods: ['playful'], saved: false },
];

describe('wedding vision board helpers', () => {
  it('validates idea titles, categories and note structure', () => {
    expect(validateVisionIdea({ title: 'Soft candlelight', category: 'decor', moods: [] }).isValid).toBe(
      true
    );
    expect(validateVisionIdea({ title: '', category: 'unknown' }).isValid).toBe(false);
    expect(
      validateVisionIdea({ title: 'Good', category: 'decor', moods: 'romantic' }).errors.moods
    ).toBeTruthy();
  });

  it('filters by category, mood, and saved-only without modifying ideas', () => {
    expect(filterVisionIdeas(ideas, { category: 'decor' })).toEqual([ideas[0]]);
    expect(filterVisionIdeas(ideas, { mood: 'playful' })).toEqual([ideas[1]]);
    expect(filterVisionIdeas(ideas, { savedOnly: true })).toEqual([ideas[0]]);
    expect(ideas).toHaveLength(2);
  });

  it('normalises valid unique tags and sorts saved ideas first', () => {
    expect(normaliseVisionTags(['romantic', 'unknown', 'romantic'])).toEqual(['romantic']);
    expect(sortVisionIdeas(ideas)[0]).toBe(ideas[0]);
  });

  it('searches idea titles, notes, categories, and moods', () => {
    expect(searchVisionIdeas(ideas, 'GARDEN')).toEqual([ideas[0]]);
    expect(searchVisionIdeas(ideas, 'Colors')).toEqual([ideas[1]]);
    expect(searchVisionIdeas(ideas, 'romantic')).toEqual([ideas[0]]);
    expect(searchVisionIdeas(ideas, '  ')).toEqual(ideas);
  });

  it('summarises ideas and saved counts', () => {
    expect(summariseVision(ideas)).toEqual({ total: 2, saved: 1, categories: 2 });
  });
});
