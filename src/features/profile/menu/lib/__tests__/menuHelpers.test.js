import { filterMenu, normaliseMenuItem, summariseMenu, validateMenuItem } from '../menuHelpers';

describe('menu helpers', () => {
  it('validates and normalizes a dish', () => {
    expect(validateMenuItem({ dish: 'Risotto', status: 'planned' }).isValid).toBe(true);
    expect(normaliseMenuItem({ dish: ' Risotto ', status: 'planned' }).dish).toBe('Risotto');
    expect(validateMenuItem({ dish: '', status: 'unknown' }).isValid).toBe(false);
  });
  it('searches dietary notes and summarizes confirmation', () => {
    const records = [
      { dish: 'Risotto', dietary: 'vegan', status: 'confirmed' },
      { dish: 'Cake', status: 'planned' },
    ];
    expect(filterMenu(records, 'all', 'vegan')).toHaveLength(1);
    expect(summariseMenu(records)).toMatchObject({ total: 2, confirmed: 1, dietaryNotes: 1 });
  });
});
