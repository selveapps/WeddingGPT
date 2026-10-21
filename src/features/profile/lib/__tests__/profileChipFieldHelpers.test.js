import {
  isChipSelectionLimitReached,
  isChipOptionSelected,
  normalizeChipValues,
  selectedChipDescriptions,
  toggleChipOption,
} from '../profileChipFieldHelpers';

describe('profile chip field helpers', () => {
  it('normalizes invalid and duplicate multi-select values', () => {
    expect(normalizeChipValues(['garden', 'classic', 'garden'])).toEqual(['garden', 'classic']);
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

  it('removes all duplicate copies of a deselected value', () => {
    expect(toggleChipOption(['garden', 'modern', 'garden'], 'garden')).toEqual(['modern']);
  });

  it('enforces a maximum without blocking deselection', () => {
    expect(toggleChipOption(['garden', 'modern'], 'classic', 2)).toEqual(['garden', 'modern']);
    expect(toggleChipOption(['garden', 'modern'], 'garden', 2)).toEqual(['modern']);
  });

  it('only reports the limit for a new selection beyond capacity', () => {
    expect(isChipSelectionLimitReached(['garden'], 'modern', 1)).toBe(true);
    expect(isChipSelectionLimitReached(['garden'], 'garden', 1)).toBe(false);
    expect(isChipSelectionLimitReached(['garden'], 'modern', undefined)).toBe(false);
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
