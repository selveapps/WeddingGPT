import { AuthStatus, createAuthStore } from '../authStore';
import { AuthError, AuthErrorCode } from '../../services/auth';
import { AnalyticsEvents } from '../../services/analytics';

const user = { id: 'user_1', email: 'priya@example.com', name: 'Priya' };
const session = { user, token: 'tok', expiresAt: '2027-02-01' };

function memoryStorage(initial = null) {
  let value = initial;
  return {
    load: jest.fn(async () => value),
    save: jest.fn(async (next) => {
      value = next;
    }),
    clear: jest.fn(async () => {
      value = null;
    }),
    peek: () => value,
  };
}

function fakeClient(overrides = {}) {
  return {
    login: jest.fn(async () => session),
    register: jest.fn(async () => session),
    me: jest.fn(async () => user),
    logout: jest.fn(async () => {}),
    ...overrides,
  };
}

function setup({ client = fakeClient(), storage = memoryStorage() } = {}) {
  const track = jest.fn();
  const store = createAuthStore({ client, storage, track });
  return { store, client, storage, track };
}

describe('authStore', () => {
  it('starts unknown and becomes signed out with nothing saved', async () => {
    const { store } = setup();
    expect(store.getState().status).toBe(AuthStatus.UNKNOWN);
    await store.getState().restore();
    expect(store.getState()).toMatchObject({ status: AuthStatus.SIGNED_OUT, user: null, token: null });
  });

  it('signs in, saves the session and tracks it', async () => {
    const { store, client, storage, track } = setup();
    await expect(
      store.getState().signIn({ email: ' priya@example.com ', password: 'secret123' })
    ).resolves.toEqual(user);
    expect(client.login).toHaveBeenCalledWith({ email: 'priya@example.com', password: 'secret123' });
    expect(store.getState()).toMatchObject({ status: AuthStatus.SIGNED_IN, user, token: 'tok' });
    expect(storage.peek()).toEqual(session);
    expect(track).toHaveBeenCalledWith(AnalyticsEvents.SIGNED_IN);
  });

  it('creates an account', async () => {
    const { store, client, track } = setup();
    await store.getState().signUp({ name: ' Priya ', email: 'priya@example.com', password: 'secret123' });
    expect(client.register).toHaveBeenCalledWith({
      name: 'Priya',
      email: 'priya@example.com',
      password: 'secret123',
    });
    expect(store.getState().status).toBe(AuthStatus.SIGNED_IN);
    expect(track).toHaveBeenCalledWith(AnalyticsEvents.SIGNED_UP);
  });

  it('stays signed out when sign-in fails', async () => {
    const client = fakeClient({
      login: jest.fn(async () => {
        throw new AuthError(AuthErrorCode.INVALID_CREDENTIALS);
      }),
    });
    const { store, storage } = setup({ client });
    await expect(store.getState().signIn({ email: 'a@b.co', password: 'nope' })).rejects.toMatchObject({
      code: AuthErrorCode.INVALID_CREDENTIALS,
    });
    expect(store.getState().status).toBe(AuthStatus.UNKNOWN);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('restores a saved session and refreshes the profile', async () => {
    const renamed = { ...user, name: 'Priya S' };
    const { store, storage } = setup({
      client: fakeClient({ me: jest.fn(async () => renamed) }),
      storage: memoryStorage(session),
    });
    await store.getState().restore();
    expect(store.getState()).toMatchObject({ status: AuthStatus.SIGNED_IN, user: renamed, token: 'tok' });
    expect(storage.peek().user).toEqual(renamed);
  });

  it('keeps the saved session when the server cannot be reached', async () => {
    const client = fakeClient({
      me: jest.fn(async () => {
        throw new AuthError(AuthErrorCode.OFFLINE);
      }),
    });
    const { store, storage } = setup({ client, storage: memoryStorage(session) });
    await store.getState().restore();
    expect(store.getState()).toMatchObject({ status: AuthStatus.SIGNED_IN, user });
    expect(storage.peek()).toEqual(session);
  });

  it('signs out when the server says the session is gone', async () => {
    const client = fakeClient({
      me: jest.fn(async () => {
        throw new AuthError(AuthErrorCode.UNAUTHORISED);
      }),
    });
    const { store, storage } = setup({ client, storage: memoryStorage(session) });
    await store.getState().restore();
    expect(store.getState().status).toBe(AuthStatus.SIGNED_OUT);
    expect(storage.peek()).toBeNull();
  });

  it('signs out locally even if the server call fails', async () => {
    const client = fakeClient({ logout: jest.fn(async () => Promise.reject(new Error('offline'))) });
    const { store, storage, track } = setup({ client });
    await store.getState().signIn({ email: 'priya@example.com', password: 'secret123' });
    await store.getState().signOut();
    expect(store.getState()).toMatchObject({ status: AuthStatus.SIGNED_OUT, user: null, token: null });
    expect(storage.peek()).toBeNull();
    expect(client.logout).toHaveBeenCalledWith('tok');
    expect(track).toHaveBeenCalledWith(AnalyticsEvents.SIGNED_OUT);
  });

  it('refuses to sign in when accounts are not configured', async () => {
    const { store } = setup({ client: null });
    expect(store.getState().isAvailable).toBe(false);
    await expect(store.getState().signIn({ email: 'a@b.co', password: 'x' })).rejects.toMatchObject({
      code: AuthErrorCode.NOT_CONFIGURED,
    });
  });

  it('still restores a saved user offline when accounts are not configured', async () => {
    const { store } = setup({ client: null, storage: memoryStorage(session) });
    await store.getState().restore();
    expect(store.getState().status).toBe(AuthStatus.SIGNED_IN);
  });
});
