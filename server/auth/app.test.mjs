import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createAuthServer, LIMITS, normaliseEmail, validateRegistration } from './app.mjs';
import { openDatabase } from './db.mjs';
import { hashPassword, verifyPassword } from './passwords.mjs';

const quiet = { info() {}, error() {} };

describe('passwords', () => {
  it('verifies the right password and rejects the wrong one', async () => {
    const hash = await hashPassword('correct horse');
    assert.match(hash, /^scrypt\$\d+\$\d+\$\d+\$/);
    assert.equal(await verifyPassword('correct horse', hash), true);
    assert.equal(await verifyPassword('wrong horse', hash), false);
  });

  it('salts every hash', async () => {
    assert.notEqual(await hashPassword('same'), await hashPassword('same'));
  });

  it('rejects malformed stored hashes', async () => {
    assert.equal(await verifyPassword('x', 'plaintext'), false);
    assert.equal(await verifyPassword('x', null), false);
  });
});

describe('validateRegistration', () => {
  it('accepts a valid registration', () => {
    assert.equal(validateRegistration({ name: 'Priya', email: 'p@example.com', password: 'longenough' }), null);
  });

  it('reports every bad field', () => {
    assert.deepEqual(validateRegistration({ name: 'x'.repeat(61), email: 'nope', password: 'short' }), {
      name: 'too_long',
      email: 'invalid',
      password: 'too_short',
    });
    assert.deepEqual(validateRegistration({}), { email: 'required', password: 'required' });
    assert.equal(
      validateRegistration({ email: 'p@example.com', password: 'x'.repeat(LIMITS.passwordMax + 1) }).password,
      'too_long'
    );
  });

  it('normalises email case and whitespace', () => {
    assert.equal(normaliseEmail('  Priya@Example.COM '), 'priya@example.com');
  });
});

describe('auth server', () => {
  let db;
  let server;
  let base;

  before(async () => {
    db = openDatabase(':memory:');
    server = createAuthServer({ db, log: quiet });
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => {
    server.close();
    db.close();
  });

  // Each test uses a fresh IP so the per-IP rate limit never leaks between tests.
  let ip = 0;
  let headers;
  beforeEach(() => {
    ip += 1;
    headers = { 'Content-Type': 'application/json', 'X-Forwarded-For': `10.0.0.${ip}` };
  });

  const post = (path, body, extra = {}) =>
    fetch(`${base}${path}`, { method: 'POST', headers: { ...headers, ...extra }, body: JSON.stringify(body) });
  const me = (token) => fetch(`${base}/v1/auth/me`, { headers: { Authorization: `Bearer ${token}` } });

  it('registers, signs in, reads the session and signs out', async () => {
    const created = await post('/v1/auth/register', {
      name: ' Priya ',
      email: 'Priya@Example.com',
      password: 'a good password',
    });
    assert.equal(created.status, 201);
    const registration = await created.json();
    assert.equal(registration.user.email, 'priya@example.com');
    assert.equal(registration.user.name, 'Priya');
    assert.equal(registration.user.password_hash, undefined);
    assert.ok(registration.token.length >= 40);

    const loggedIn = await post('/v1/auth/login', { email: 'PRIYA@example.com', password: 'a good password' });
    assert.equal(loggedIn.status, 200);
    const { token } = await loggedIn.json();

    const current = await me(token);
    assert.equal(current.status, 200);
    assert.equal((await current.json()).user.id, registration.user.id);

    const out = await post('/v1/auth/logout', {}, { Authorization: `Bearer ${token}` });
    assert.equal(out.status, 204);
    assert.equal((await me(token)).status, 401);
    // Signing out one device leaves the other signed in.
    assert.equal((await me(registration.token)).status, 200);
  });

  it('refuses a second account with the same email', async () => {
    await post('/v1/auth/register', { email: 'sam@example.com', password: 'password one' });
    const again = await post('/v1/auth/register', { email: 'SAM@example.com', password: 'password two' });
    assert.equal(again.status, 409);
    assert.deepEqual(await again.json(), { error: 'email_taken' });
  });

  it('returns field errors for an invalid registration', async () => {
    const response = await post('/v1/auth/register', { email: 'bad', password: '123' });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: 'invalid',
      fields: { email: 'invalid', password: 'too_short' },
    });
  });

  it('gives the same answer for a wrong password and an unknown email', async () => {
    await post('/v1/auth/register', { email: 'jo@example.com', password: 'right password' });
    const wrong = await post('/v1/auth/login', { email: 'jo@example.com', password: 'wrong password' });
    const unknown = await post('/v1/auth/login', { email: 'nobody@example.com', password: 'right password' });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.deepEqual(await wrong.json(), await unknown.json());
  });

  it('stores only a hash of each session token', async () => {
    const response = await post('/v1/auth/register', { email: 'ana@example.com', password: 'another password' });
    const { token } = await response.json();
    db.deleteSession('not-a-real-token');
    assert.equal(db.userForToken(token).email, 'ana@example.com');
    assert.equal(db.userForToken(`${token}x`), null);
  });

  it('rejects missing or unknown tokens', async () => {
    assert.equal((await fetch(`${base}/v1/auth/me`)).status, 401);
    assert.equal((await me('made-up')).status, 401);
  });

  it('rejects malformed and oversized bodies', async () => {
    const malformed = await fetch(`${base}/v1/auth/login`, { method: 'POST', headers, body: '{nope' });
    assert.equal(malformed.status, 400);
    const array = await post('/v1/auth/login', []);
    assert.equal(array.status, 400);
    const huge = await post('/v1/auth/login', { email: 'a@b.co', password: 'x'.repeat(LIMITS.bodyBytes) });
    assert.equal(huge.status, 413);
  });

  it('rate limits repeated sign-in attempts from one address', async () => {
    const statuses = [];
    for (let i = 0; i <= LIMITS.attemptsPerMinute; i += 1) {
      statuses.push((await post('/v1/auth/login', { email: 'x@example.com', password: 'whatever' })).status);
    }
    assert.equal(statuses.at(-1), 429);
    assert.ok(statuses.slice(0, -1).every((status) => status === 401));
  });

  it('answers health checks and unknown routes', async () => {
    assert.equal((await fetch(`${base}/health`)).status, 200);
    assert.equal((await fetch(`${base}/v1/auth/nope`)).status, 404);
  });
});

describe('app token', () => {
  it('requires the shared token when one is configured', async () => {
    const db = openDatabase(':memory:');
    const server = createAuthServer({ db, appToken: 'secret', log: quiet });
    await new Promise((resolve) => server.listen(0, resolve));
    const url = `http://127.0.0.1:${server.address().port}/v1/auth/login`;
    const body = JSON.stringify({ email: 'a@example.com', password: 'whatever1' });
    const json = { 'Content-Type': 'application/json' };

    try {
      assert.equal((await fetch(url, { method: 'POST', headers: json, body })).status, 401);
      const withToken = await fetch(url, { method: 'POST', headers: { ...json, 'X-App-Token': 'secret' }, body });
      assert.equal(withToken.status, 401);
      assert.deepEqual(await withToken.json(), { error: 'invalid_credentials' });
    } finally {
      server.close();
      db.close();
    }
  });
});
