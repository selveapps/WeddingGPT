import {
  filterVisionIdeas,
  normaliseVisionTags,
  searchVisionIdeas,
  sortVisionIdeas,
  summariseVision,
  validateVisionIdea,
  visionPhotoAspect,
  visionPhotoKeys,
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

  it('supports alphabetical ordering within pinned and unpinned groups', () => {
    const list = [
      { title: 'Zulu', saved: false },
      { title: 'Bravo', saved: true },
      { title: 'Alpha', saved: false },
      { title: 'Able', saved: true },
    ];
    expect(sortVisionIdeas(list, 'title').map((idea) => idea.title)).toEqual([
      'Able',
      'Bravo',
      'Alpha',
      'Zulu',
    ]);
  });

  it('searches idea titles, notes, categories, and moods', () => {
    expect(searchVisionIdeas(ideas, 'GARDEN')).toEqual([ideas[0]]);
    expect(searchVisionIdeas(ideas, 'Colors')).toEqual([ideas[1]]);
    expect(searchVisionIdeas(ideas, 'romantic')).toEqual([ideas[0]]);
    expect(searchVisionIdeas(ideas, '  ')).toEqual(ideas);
  });

  it('summarises ideas and saved counts', () => {
    expect(summariseVision(ideas)).toEqual({
      total: 2,
      saved: 1,
      photos: 0,
      categories: 2,
      categoryCounts: { decor: 1, palette: 1 },
    });
  });
});

describe('vision board photos', () => {
  it('lists the photo keys on the board and counts them', () => {
    const board = [{ photo: { key: 'photo_A.jpg' } }, { photo: null }, {}];
    expect(visionPhotoKeys(board)).toEqual(['photo_A.jpg']);
    expect(summariseVision(board).photos).toBe(1);
  });

  it('keeps odd shapes between 3:4 and 16:9', () => {
    expect(visionPhotoAspect({ width: 3024, height: 4032 })).toBe(0.75);
    expect(visionPhotoAspect({ width: 6000, height: 1000 })).toBeCloseTo(16 / 9);
    expect(visionPhotoAspect({ width: null, height: null })).toBe(1);
  });

  it('refuses a photo without a key', () => {
    const idea = { title: 'Lanterns', category: 'decor' };
    expect(validateVisionIdea({ ...idea, photo: { key: 'photo_A.jpg' } }).isValid).toBe(true);
    expect(validateVisionIdea({ ...idea, photo: {} }).errors.photo).toBeTruthy();
  });
});
