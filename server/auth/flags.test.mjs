import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createAuthServer } from './app.mjs';
import { openDatabase } from './db.mjs';
import { FLAG_LIMITS, parseFlagList } from './flags.mjs';

const quiet = { info() {}, error() {} };

describe('parseFlagList', () => {
  it('reads name=value pairs, any app flag name, on or off', () => {
    assert.deepEqual(parseFlagList(' liveMode = OFF, visionPhotos=on ,newThing=1').flags, {
      liveMode: false,
      visionPhotos: true,
      newThing: true,
    });
  });

  it('skips what it cannot read, and reads nothing from nothing', () => {
    const { flags, skipped } = parseFlagList('liveMode=maybe,__proto__=on,a=b=on,9lives=on,ok=no');
    assert.deepEqual(flags, { ok: false });
    assert.equal(Object.getPrototypeOf(flags), Object.prototype);
    assert.deepEqual(skipped, ['liveMode=maybe', '__proto__=on', 'a=b=on', '9lives=on']);
    assert.deepEqual(parseFlagList(undefined), { flags: {}, skipped: [] });
  });

  it('keeps at most the first 50', () => {
    const many = Array.from({ length: FLAG_LIMITS.flags + 3 }, (_, i) => `f${i}=on`).join(',');
    assert.equal(Object.keys(parseFlagList(many).flags).length, FLAG_LIMITS.flags);
  });
});

describe('GET /v1/flags', () => {
  let db;
  let server;
  let base;

  before(async () => {
    db = openDatabase(':memory:');
    server = createAuthServer({ db, appToken: 'secret', flags: { liveMode: false }, log: quiet });
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => {
    server.close();
    db.close();
  });

  it('answers without signing in, with the app token', async () => {
    const response = await fetch(`${base}/v1/flags`, { headers: { 'X-App-Token': 'secret' } });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { flags: { liveMode: false } });
  });

  it('still needs the app token when the server has one', async () => {
    assert.equal((await fetch(`${base}/v1/flags`)).status, 401);
  });
});
