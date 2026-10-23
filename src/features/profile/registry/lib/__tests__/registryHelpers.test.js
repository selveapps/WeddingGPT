import {
  normalizeRegistryItem,
  searchRegistry,
  sortRegistry,
  summarizeRegistry,
  validateRegistryItem,
} from '../registryHelpers';

describe('registry helpers', () => {
  it('validates required item, price and safe URL format', () => {
    expect(
      validateRegistryItem({ store: '', item: '', price: '-2', url: 'javascript:alert(1)' }).isValid
    ).toBe(false);
    expect(
      validateRegistryItem({
        store: 'Local shop',
        item: 'Vase',
        price: '24.50',
        url: 'https://example.com/vase',
      }).isValid
    ).toBe(true);
  });

  it('normalizes, searches, sorts and summarizes gifts', () => {
    const records = [
      normalizeRegistryItem({ store: 'Zeta', item: 'Cups', price: '20', status: 'thanked' }),
      normalizeRegistryItem({ store: 'Alpha', item: 'Linen', status: 'listed' }),
    ];
    expect(searchRegistry(records, 'cup')).toHaveLength(1);
    expect(sortRegistry(records)[0].store).toBe('Alpha');
    expect(summarizeRegistry(records)).toEqual({ total: 2, reserved: 1, thanked: 1 });
  });
});
