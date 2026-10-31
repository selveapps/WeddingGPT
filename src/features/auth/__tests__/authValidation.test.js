import { AuthMode, validateAuthField, validateAuthForm } from '../authValidation';

describe('validateAuthForm', () => {
  it('needs an email and password to sign in', () => {
    expect(validateAuthForm(AuthMode.SIGN_IN, { email: '', password: '' }).errors).toEqual({
      email: 'Email is required.',
      password: 'Password is required.',
    });
    expect(validateAuthForm(AuthMode.SIGN_IN, { email: 'p@example.com', password: 'x' }).isValid).toBe(true);
  });

  it('checks password length only when creating an account', () => {
    expect(validateAuthForm(AuthMode.SIGN_UP, { email: 'p@example.com', password: 'short' }).errors).toEqual({
      password: 'Use at least 8 characters.',
    });
    expect(
      validateAuthForm(AuthMode.SIGN_UP, { email: 'p@example.com', password: 'x'.repeat(129) }).errors
        .password
    ).toBe('Your password is limited to 128 characters.');
    expect(
      validateAuthForm(AuthMode.SIGN_UP, { name: '', email: 'p@example.com', password: 'longenough' }).isValid
    ).toBe(true);
  });

  it('counts spaces towards the password length', () => {
    expect(validateAuthForm(AuthMode.SIGN_UP, { email: 'p@example.com', password: '  pass  ' }).isValid).toBe(
      true
    );
  });

  it('rejects incomplete emails and long names', () => {
    const { errors } = validateAuthForm(AuthMode.SIGN_UP, {
      name: 'x'.repeat(61),
      email: 'priya@',
      password: 'longenough',
    });
    expect(errors).toEqual({
      name: 'Your name is limited to 60 characters.',
      email: 'That email address looks incomplete.',
    });
  });
});

describe('validateAuthField', () => {
  it('checks one field for the current mode', () => {
    expect(validateAuthField(AuthMode.SIGN_UP, 'password', 'short')).toBe('Use at least 8 characters.');
    expect(validateAuthField(AuthMode.SIGN_IN, 'password', 'short')).toBeNull();
    expect(validateAuthField(AuthMode.SIGN_IN, 'name', 'x'.repeat(100))).toBeNull();
  });
});
