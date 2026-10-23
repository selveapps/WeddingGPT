import { normalizeAttire, searchAttire, sortAttire, summarizeAttire, validateAttire } from '../attireHelpers';

describe('attire helpers', () => {
  it('requires person and garment and checks date format', () => {
    expect(validateAttire({ person: '', garment: '', fittingDate: 'Friday' }).isValid).toBe(false);
    expect(validateAttire({ person: 'Lee', garment: 'Suit', fittingDate: '2027-05-01' }).isValid).toBe(true);
  });

  it('normalizes values, searches and summarizes records', () => {
    const records = [
      normalizeAttire({ person: ' Lee ', garment: ' Suit ', status: 'ready' }),
      normalizeAttire({ person: 'Mina', garment: 'Dress', status: 'planned' }),
    ];
    expect(searchAttire(records, 'suit')).toHaveLength(1);
    expect(sortAttire(records)[0].person).toBe('Lee');
    expect(summarizeAttire(records)).toEqual({ total: 2, ready: 1, upcoming: 2 });
  });
});
