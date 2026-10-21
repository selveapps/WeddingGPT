import {
  isChipOptionSelected,
  normalizeChipValues,
  selectedChipDescriptions,
  toggleChipOption,
} from '../profileChipFieldHelpers';

describe('profile chip field helpers', () => {
  it('normalizes invalid and duplicate multi-select values', () => {
    expect(normalizeChipValues(['garden', 'classic', 'garden'])).toEqual([
      'garden',
      'classic',
    ]);
    expect(normalizeChipValues(null)).toEqual([]);
    expect(normalizeChipValues('garden')).toEqual([]);
  });

  it('checks single and multiple selections', () => {
    expect(isChipOptionSelected('garden', 'garden', false)).toBe(true);
    expect(isChipOptionSelected(['garden'], 'garden', true)).toBe(true);
    expect(isChipOptionSelected(['garden'], 'modern', true)).toBe(false);
  });

  it('toggles a multi-select value without mutating the original list', () => {
    const value = ['garden'];
    expect(toggleChipOption(value, 'modern')).toEqual(['garden', 'modern']);
    expect(toggleChipOption(value, 'garden')).toEqual([]);
    expect(value).toEqual(['garden']);
  });

  it('returns descriptions for selected options in option order', () => {
    const options = [
      { value: 'garden', description: 'Soft and natural' },
      { value: 'modern', description: 'Clean and minimal' },
      { value: 'classic' },
    ];
    expect(selectedChipDescriptions(options, ['modern', 'garden'])).toEqual([
      'Soft and natural',
      'Clean and minimal',
    ]);
  });
});
