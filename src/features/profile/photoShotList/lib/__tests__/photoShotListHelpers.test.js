import {
  filterPhotoShots,
  normalisePhotoShot,
  summarisePhotoShots,
  validatePhotoShot,
} from '../photoShotListHelpers';

describe('photo shot list helpers', () => {
  it('validates and normalizes a shot', () => {
    expect(validatePhotoShot({ shot: 'Family portrait', priority: 'must-have' }).isValid).toBe(true);
    expect(normalisePhotoShot({ shot: ' Portrait ', priority: 'must-have' }).shot).toBe('Portrait');
    expect(validatePhotoShot({ shot: '', priority: 'urgent' }).isValid).toBe(false);
  });
  it('filters completion and summarizes progress', () => {
    const shots = [
      { shot: 'Couple', completed: true, priority: 'must-have' },
      { shot: 'Details', completed: false, priority: 'nice-to-have' },
    ];
    expect(filterPhotoShots(shots, 'remaining')).toHaveLength(1);
    expect(summarisePhotoShots(shots)).toMatchObject({ total: 2, completed: 1, remaining: 1, mustHave: 1 });
  });
});
