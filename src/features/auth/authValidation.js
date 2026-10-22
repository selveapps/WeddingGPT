import { rules, validateForm } from '@/lib/validation';

/**
 * Client-side checks for the sign-in and create-account forms.
 *
 * They mirror the server's limits (server/auth/app.mjs) so most mistakes are
 * caught before a round trip. The server still checks everything - these only
 * make the form friendlier.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const AuthMode = {
  SIGN_IN: 'signIn',
  SIGN_UP: 'signUp',
};

const emailRules = [rules.required('Email'), rules.email(), rules.maxLength(254, 'Email')];

const SCHEMAS = {
  [AuthMode.SIGN_IN]: {
    email: emailRules,
    password: [rules.required('Password')],
  },
  [AuthMode.SIGN_UP]: {
    name: [rules.maxLength(60, 'Your name')],
    email: emailRules,
    password: [
      rules.required('Password'),
      (value) =>
        value && value.length < PASSWORD_MIN_LENGTH
          ? `Use at least ${PASSWORD_MIN_LENGTH} characters.`
          : null,
      rules.maxLength(PASSWORD_MAX_LENGTH, 'Your password'),
    ],
  },
};

/** `{ isValid, errors }` for the given mode. */
export function validateAuthForm(mode, values) {
  return validateForm(values, SCHEMAS[mode] ?? SCHEMAS[AuthMode.SIGN_IN]);
}

/** One field, for on-blur checks. */
export function validateAuthField(mode, field, value) {
  const schema = SCHEMAS[mode] ?? SCHEMAS[AuthMode.SIGN_IN];
  if (!schema[field]) return null;
  return validateForm({ [field]: value }, { [field]: schema[field] }).errors[field] ?? null;
}
