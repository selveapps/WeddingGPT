import { validateAttireItem, validateFitting, validateAccessory, normalizeHex } from '../attireValidation';

describe('attireValidation', () => {
  it('requires title or wearer', () => {
    expect(validateAttireItem({}).ok).toBe(false);
    expect(validateAttireItem({ title: 'Gown' }).ok).toBe(true);
  });

  it('rejects negative cost', () => {
    expect(validateAttireItem({ title: 'X', cost: -1 }).ok).toBe(false);
  });

  it('fitting needs item', () => {
    expect(validateFitting({ status: 'scheduled' }).ok).toBe(false);
    expect(validateFitting({ attireItemId: '1', status: 'scheduled', scheduledAt: '2026-01-01' }).ok).toBe(true);
  });

  it('accessory name required', () => {
    expect(validateAccessory({}).ok).toBe(false);
    expect(validateAccessory({ name: 'Veil' }).ok).toBe(true);
  });

  it('normalizeHex', () => {
    expect(normalizeHex('e8b4b8')).toBe('#E8B4B8');
    expect(normalizeHex('#E8B4B8')).toBe('#E8B4B8');
    expect(normalizeHex('bad')).toBe(null);
  });
});
