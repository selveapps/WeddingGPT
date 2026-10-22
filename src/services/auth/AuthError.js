/**
 * Errors the auth service can raise, each with copy a screen can show as-is.
 *
 * Screens never see HTTP statuses: the client turns every failure into one of
 * these codes, so the wording lives in one place and stays in the product's
 * voice.
 */

export const AuthErrorCode = {
  NOT_CONFIGURED: 'not_configured',
  OFFLINE: 'offline',
  TIMEOUT: 'timeout',
  INVALID: 'invalid',
  INVALID_CREDENTIALS: 'invalid_credentials',
  EMAIL_TAKEN: 'email_taken',
  UNAUTHORISED: 'unauthorised',
  RATE_LIMITED: 'rate_limited',
  UNAVAILABLE: 'unavailable',
};

export const AUTH_ERROR_MESSAGES = {
  [AuthErrorCode.NOT_CONFIGURED]: 'Accounts are not switched on in this build yet.',
  [AuthErrorCode.OFFLINE]: 'You seem to be offline. Check your connection and try again.',
  [AuthErrorCode.TIMEOUT]: 'That took too long. Please try again.',
  [AuthErrorCode.INVALID]: 'A few details need another look.',
  [AuthErrorCode.INVALID_CREDENTIALS]: 'That email and password do not match an account.',
  [AuthErrorCode.EMAIL_TAKEN]: 'There is already an account with that email. Try signing in instead.',
  [AuthErrorCode.UNAUTHORISED]: 'You have been signed out. Please sign in again.',
  [AuthErrorCode.RATE_LIMITED]: 'Too many attempts. Wait a minute, then try again.',
  [AuthErrorCode.UNAVAILABLE]: 'Accounts are unavailable right now. Please try again shortly.',
};

/** Server field codes -> messages under the matching input. */
export const AUTH_FIELD_MESSAGES = {
  name: { too_long: 'Your name is limited to 60 characters.' },
  email: {
    required: 'Email is required.',
    invalid: 'That email address looks incomplete.',
  },
  password: {
    required: 'Password is required.',
    too_short: 'Use at least 8 characters.',
    too_long: 'Passwords are limited to 128 characters.',
  },
};

export class AuthError extends Error {
  constructor(code, { fields = null } = {}) {
    super(AUTH_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES[AuthErrorCode.UNAVAILABLE]);
    this.name = 'AuthError';
    this.code = code;
    /** `{ field: message }` for an INVALID error, so the form can mark each input. */
    this.fields = fields;
  }
}

/** Turn the server's `{ field: code }` into `{ field: message }`. */
export function fieldMessages(fields) {
  if (!fields) return null;
  const messages = {};
  for (const [field, code] of Object.entries(fields)) {
    messages[field] = AUTH_FIELD_MESSAGES[field]?.[code] ?? 'Check this field.';
  }
  return messages;
}
