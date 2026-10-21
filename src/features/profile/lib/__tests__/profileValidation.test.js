import {
  firstErrorSection,
  sectionForProfileField,
  validateOptionalNote,
  validateProfileField,
  validateProfileValues,
} from '../profileValidation';
import { EMPTY_PROFILE_VALUES, MAX_GUEST_COUNT } from '../profileConstants';

const valid = { ...EMPTY_PROFILE_VALUES, ownerName: 'Priya' };

describe('validateProfileValues', () => {
  it('accepts a minimal profile', () => {
    expect(validateProfileValues(valid)).toEqual({ isValid: true, errors: {} });
  });

  it('requires your name', () => {
    expect(validateProfileValues(EMPTY_PROFILE_VALUES).errors.ownerName).toBe('Your name is required.');
  });

  it('checks email, phone and dates', () => {
    const { errors } = validateProfileValues({
      ...valid,
      email: 'priya@',
      partnerEmail: 'sam',
      phone: '12',
      date: '2027-02-30',
    });
    expect(Object.keys(errors).sort()).toEqual(['date', 'email', 'partnerEmail', 'phone']);
  });

  it('only checks guest count and budget when they are set', () => {
    expect(validateProfileValues({ ...valid, guestCountEstimate: '', budgetTotal: null }).isValid).toBe(true);
    const { errors } = validateProfileValues({
      ...valid,
      guestCountEstimate: MAX_GUEST_COUNT + 1,
      budgetTotal: -5,
    });
    expect(errors.guestCountEstimate).toBe(`Guest count must be ${MAX_GUEST_COUNT} or less.`);
    expect(errors.budgetTotal).toBe('Budget cannot be negative.');
  });

  it('asks for a day when the date type is exact', () => {
    expect(validateProfileValues({ ...valid, dateType: 'exact', date: null }).errors.date).toBe(
      'Pick a date, or choose a looser option.'
    );
  });
});

describe('validateProfileField', () => {
  it('lets empty numbers through', () => {
    expect(validateProfileField('guestCountEstimate', '')).toBeNull();
    expect(validateProfileField('budgetTotal', null)).toBeNull();
  });

  it('checks numbers when present', () => {
    expect(validateProfileField('guestCountEstimate', 0)).toBe('Guest count must be at least 1.');
    expect(validateProfileField('budgetTotal', 'abc')).toBe('Budget must be a number.');
  });

  it('checks the date against the date type', () => {
    expect(validateProfileField('date', null, { dateType: 'exact' })).toBe(
      'Pick a date, or choose a looser option.'
    );
    expect(validateProfileField('date', null, { dateType: 'month' })).toBeNull();
    expect(validateProfileField('date', '2027-13-01')).toBe('Pick a valid date.');
  });

  it('ignores fields without rules', () => {
    expect(validateProfileField('styleTags', [])).toBeNull();
  });
});

describe('sections', () => {
  it('maps fields to their form section', () => {
    expect(sectionForProfileField('email')).toBe('personal');
    expect(sectionForProfileField('partnerEmail')).toBe('partner');
    expect(sectionForProfileField('budgetTotal')).toBe('wedding');
    expect(sectionForProfileField('stressors')).toBe('vision');
    expect(sectionForProfileField('nope')).toBeNull();
  });

  it('finds the section of the first error', () => {
    expect(firstErrorSection({ city: 'x', email: 'y' }, sectionForProfileField)).toBe('wedding');
    expect(firstErrorSection({}, sectionForProfileField)).toBeNull();
    expect(firstErrorSection(null, sectionForProfileField)).toBeNull();
  });
});

describe('validateOptionalNote', () => {
  it('limits note length', () => {
    expect(validateOptionalNote('short')).toBeNull();
    expect(validateOptionalNote('x'.repeat(501))).toBe('Notes is limited to 500 characters.');
  });
});
