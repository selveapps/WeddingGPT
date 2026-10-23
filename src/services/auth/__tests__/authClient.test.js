import { createAuthClient } from '../authClient';
import { AuthErrorCode } from '../AuthError';
import { savedSession } from '../savedSession';

const user = { id: 'user_1', email: 'priya@example.com', name: 'Priya' };

const reply = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => {
    if (body === undefined) throw new Error('no body');
    return body;
  },
});

function clientWith(...responses) {
  const fetchImpl = jest.fn();
  for (const response of responses) {
    if (response instanceof Error) fetchImpl.mockRejectedValueOnce(response);
    else fetchImpl.mockResolvedValueOnce(response);
  }
  return {
    client: createAuthClient({ url: 'https://auth.example.com/', appToken: 'app', fetchImpl }),
    fetchImpl,
  };
}

const codeOf = (promise) =>
  promise.then(
    () => null,
    (error) => error.code
  );

describe('createAuthClient', () => {
  it('signs in and returns the session', async () => {
    const { client, fetchImpl } = clientWith(reply(200, { user, token: 'tok', expiresAt: '2027-02-01' }));
    await expect(client.login({ email: 'priya@example.com', password: 'secret123' })).resolves.toEqual({
      user,
      token: 'tok',
      expiresAt: '2027-02-01',
    });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://auth.example.com/v1/auth/login');
    expect(init.method).toBe('POST');
    expect(init.headers['X-App-Token']).toBe('app');
    expect(JSON.parse(init.body)).toEqual({ email: 'priya@example.com', password: 'secret123' });
  });

  it('sends the bearer token for me and logout', async () => {
    const { client, fetchImpl } = clientWith(reply(200, { user }), reply(204));
    await expect(client.me('tok')).resolves.toEqual(user);
    await expect(client.logout('tok')).resolves.toBeUndefined();
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
    expect(fetchImpl.mock.calls[1][0]).toBe('https://auth.example.com/v1/auth/logout');
  });

  it('maps server refusals to error codes', async () => {
    const { client } = clientWith(
      reply(401, { error: 'invalid_credentials' }),
      reply(401, { error: 'unauthorised' }),
      reply(409, { error: 'email_taken' }),
      reply(429, { error: 'rate_limited' }),
      reply(503, { error: 'unavailable' })
    );
    expect(await codeOf(client.login({ email: 'a', password: 'b' }))).toBe(AuthErrorCode.INVALID_CREDENTIALS);
    expect(await codeOf(client.me('old'))).toBe(AuthErrorCode.UNAUTHORISED);
    expect(await codeOf(client.register({ email: 'a', password: 'b' }))).toBe(AuthErrorCode.EMAIL_TAKEN);
    expect(await codeOf(client.login({ email: 'a', password: 'b' }))).toBe(AuthErrorCode.RATE_LIMITED);
    expect(await codeOf(client.login({ email: 'a', password: 'b' }))).toBe(AuthErrorCode.UNAVAILABLE);
  });

  it('turns field codes into messages', async () => {
    const { client } = clientWith(reply(400, { error: 'invalid', fields: { password: 'too_short' } }));
    const error = await client.register({ email: 'a@b.co', password: 'x' }).catch((e) => e);
    expect(error.code).toBe(AuthErrorCode.INVALID);
    expect(error.fields).toEqual({ password: 'Use at least 8 characters.' });
  });

  it('reports network failures and timeouts', async () => {
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const { client } = clientWith(new TypeError('Network request failed'), abort);
    expect(await codeOf(client.login({ email: 'a', password: 'b' }))).toBe(AuthErrorCode.OFFLINE);
    expect(await codeOf(client.login({ email: 'a', password: 'b' }))).toBe(AuthErrorCode.TIMEOUT);
  });

  it('rejects a success response without a usable session', async () => {
    const { client } = clientWith(reply(200, { user }), reply(200));
    expect(await codeOf(client.login({ email: 'a', password: 'b' }))).toBe(AuthErrorCode.UNAVAILABLE);
    expect(await codeOf(client.me('tok'))).toBe(AuthErrorCode.UNAVAILABLE);
  });
});

describe('savedSession', () => {
  afterEach(() => savedSession.clear());

  it('saves, loads and clears a session', async () => {
    await savedSession.save({ token: 'tok', user, expiresAt: null });
    await expect(savedSession.load()).resolves.toEqual({ token: 'tok', user, expiresAt: null });
    await savedSession.clear();
    await expect(savedSession.load()).resolves.toBeNull();
  });

  it('treats a damaged entry as signed out', async () => {
    const SecureStore = require('expo-secure-store');
    await SecureStore.setItemAsync('auth.session', '{not json');
    await expect(savedSession.load()).resolves.toBeNull();
    await SecureStore.setItemAsync('auth.session', JSON.stringify({ token: 'tok' }));
    await expect(savedSession.load()).resolves.toBeNull();
  });
});

describe('account export and deletion', () => {
  it('exports with the token', async () => {
    const data = { user, workspaces: [] };
    const { client, fetchImpl } = clientWith(reply(200, data));
    await expect(client.exportAccount('tok')).resolves.toEqual(data);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://auth.example.com/v1/account/export');
    expect(init.headers.Authorization).toBe('Bearer tok');
  });

  it('refuses an export that is not one', async () => {
    const { client } = clientWith(reply(200, { nope: true }));
    expect(await codeOf(client.exportAccount('tok'))).toBe(AuthErrorCode.UNAVAILABLE);
  });

  it('deletes with the password, and reports a wrong one', async () => {
    const { client, fetchImpl } = clientWith(reply(204), reply(401, { error: 'invalid_credentials' }));
    await client.deleteAccount('tok', 'a good password');
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://auth.example.com/v1/account');
    expect(init.method).toBe('DELETE');
    expect(JSON.parse(init.body)).toEqual({ password: 'a good password' });
    expect(await codeOf(client.deleteAccount('tok', 'nope'))).toBe(AuthErrorCode.INVALID_CREDENTIALS);
  });
});
