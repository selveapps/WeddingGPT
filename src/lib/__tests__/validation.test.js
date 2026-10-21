import { rules, validate, validateForm } from '../validation';

describe('rules', () => {
  it('required rejects empty, whitespace and empty arrays', () => {
    const required = rules.required('Name');
    expect(required('')).toBe('Name is required.');
    expect(required('   ')).toBe('Name is required.');
    expect(required(null)).toBe('Name is required.');
    expect(required([])).toBe('Pick at least one option.');
    expect(required('Sam')).toBeNull();
  });

  it('maxLength caps long text', () => {
    expect(rules.maxLength(3, 'Code')('abcd')).toBe('Code is limited to 3 characters.');
    expect(rules.maxLength(3)('abc')).toBeNull();
  });

  it('email accepts real-looking addresses only', () => {
    const email = rules.email();
    expect(email('sam@example.com')).toBeNull();
    expect(email('sam@example')).not.toBeNull();
    // Emptiness is the job of `required`.
    expect(email('')).toBeNull();
  });

  it('phone wants 7 to 15 digits, ignoring formatting', () => {
    const phone = rules.phone();
    expect(phone('+1 (555) 010-2030')).toBeNull();
    expect(phone('12345')).not.toBeNull();
  });

  it('isoDate checks the YYYY-MM-DD shape', () => {
    expect(rules.isoDate()('2027-06-12')).toBeNull();
    expect(rules.isoDate()('12/06/2027')).toBe('Pick a valid date.');
  });

  it('isoDate rejects days that do not exist', () => {
    expect(rules.isoDate()('2027-02-31')).toBe('Pick a valid date.');
    expect(rules.isoDate()('2027-13-01')).toBe('Pick a valid date.');
    expect(rules.isoDate()('2028-02-29')).toBeNull();
  });
});

describe('validate / validateForm', () => {
  it('returns the first failing rule', () => {
    expect(validate('', [rules.required('Title'), rules.minLength(3)])).toBe('Title is required.');
  });

  it('only reports failing fields', () => {
    const result = validateForm(
      { title: 'Book the venue', email: 'nope' },
      { title: [rules.required('Title')], email: [rules.email()] }
    );
    expect(result.isValid).toBe(false);
    expect(Object.keys(result.errors)).toEqual(['email']);
  });
});
