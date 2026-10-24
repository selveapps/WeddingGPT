import { VendorStatus } from '@/models';

import {
  buildVendorComparison,
  vendorCategoriesForComparison,
  vendorComparisonText,
} from '../vendorComparison';

const vendor = (id, overrides = {}) => ({
  id,
  name: id,
  categoryKey: 'photography',
  status: VendorStatus.QUOTED,
  quotedAmount: null,
  quoteScope: '',
  payments: [],
  ...overrides,
});

describe('vendorCategoriesForComparison', () => {
  it('offers only categories with at least two vendors', () => {
    const vendors = [
      vendor('one', { categoryKey: 'photography' }),
      vendor('two', { categoryKey: 'photography' }),
      vendor('venue', { categoryKey: 'venue' }),
      vendor('venue-two', { categoryKey: 'venue' }),
    ];

    expect(vendorCategoriesForComparison(vendors).map((category) => category.key)).toEqual([
      'venue',
      'photography',
    ]);
  });
});

describe('buildVendorComparison', () => {
  it('compares quotes, scope, status and payment progress for matching vendors', () => {
    const vendors = [
      vendor('Willow Photo', {
        quotedAmount: 250000,
        quoteScope: 'Full day, two photographers',
        city: 'Austin',
        payments: [{ id: 'deposit', amount: 50000, paidAt: '2026-10-01' }],
      }),
      vendor('Light House', { quotedAmount: 300000, quoteScope: 'Full day, one photographer' }),
    ];

    const comparison = buildVendorComparison(vendors, 'USD');

    expect(comparison.category.name).toBe('Photography');
    expect(comparison.quoteDifference).toEqual({ amount: 50000, lowerVendorName: 'Willow Photo' });
    expect(comparison.rows.find((row) => row.label === 'Quoted total').values).toEqual(['$2,500', '$3,000']);
    expect(comparison.rows.find((row) => row.label === 'Quote includes').values).toEqual([
      'Full day, two photographers',
      'Full day, one photographer',
    ]);
    expect(comparison.rows.find((row) => row.label === 'Paid so far').values[0]).toBe('$500');
    expect(comparison.rows.find((row) => row.label === 'Still outstanding').values).toEqual([
      '$2,000',
      '$3,000',
    ]);
    expect(vendorComparisonText(comparison)).toContain('Willow Photo');
    expect(vendorComparisonText(comparison)).toContain('Status: Quote received');
  });

  it('rejects comparisons unless exactly two vendors share a category', () => {
    expect(buildVendorComparison([vendor('one')])).toBeNull();
    expect(buildVendorComparison([vendor('photo'), vendor('venue', { categoryKey: 'venue' })])).toBeNull();
  });

  it('labels missing quote information instead of treating it as free', () => {
    const comparison = buildVendorComparison([vendor('one'), vendor('two')]);
    const quoteRow = comparison.rows.find((row) => row.label === 'Quoted total');

    expect(quoteRow.values).toEqual(['No quote yet', 'No quote yet']);
    expect(comparison.quoteDifference).toBeNull();
  });
});
