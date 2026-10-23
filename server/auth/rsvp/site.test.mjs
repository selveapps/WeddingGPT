import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createAuthServer } from '../app.mjs';
import { openDatabase } from '../db.mjs';
import { RSVP_RATE_LIMITS } from './routes.mjs';
import { safeUrl, sanitiseContent, validateSiteSettings } from './site.mjs';

const quiet = { info() {}, error() {} };
const DAY = 86400000;

describe('site rules', () => {
  it('renders only http(s) links (W3)', () => {
    assert.equal(safeUrl('https://example.com/registry'), 'https://example.com/registry');
    assert.equal(safeUrl('http://example.com'), 'http://example.com/');
    for (const bad of ['javascript:alert(1)', 'JAVASCRIPT:alert(1)', 'data:text/html,<script>', '/relative', 'example.com', null, 42]) {
      assert.equal(safeUrl(bad), null, String(bad));
    }
  });

  it('keeps only what the page may show', () => {
    const content = sanitiseContent({
      welcome: { title: '  Welcome ', body: 'Hi' },
      events: [{ name: 'Ceremony', date: '2027-09-12', time: '3pm', place: 'Garden' }, { notes: 'no name' }],
      stays: [{ name: 'Hotel', url: 'javascript:alert(1)' }, { url: 'https://nameless.example' }],
      registry: [{ name: 'Gifts', url: 'https://gifts.example' }, { name: 'Bad', url: 'javascript:x' }],
      faq: [{ question: 'Kids?', answer: 'Yes' }, { question: 'No answer' }],
      guests: [{ firstName: 'Should never appear' }],
    });
    assert.equal(content.welcomeTitle, 'Welcome');
    assert.equal(content.events.length, 1);
    assert.deepEqual(content.stays, [{ name: 'Hotel', url: null, notes: '' }]);
    assert.deepEqual(content.registry, [{ name: 'Gifts', url: 'https://gifts.example/' }]);
    assert.equal(content.faq.length, 1);
    assert.ok(!JSON.stringify(content).includes('Should never appear'));
  });

  it('validates settings', () => {
    assert.equal(validateSiteSettings({ visibility: 'public', indexable: true }), null);
    assert.deepEqual(validateSiteSettings({ visibility: 'everyone' }), { visibility: 'invalid' });
    assert.deepEqual(validateSiteSettings({ password: 'abc' }), { password: 'too_short' });
    assert.deepEqual(validateSiteSettings({ indexable: 'yes' }), { indexable: 'invalid' });
  });
});

describe('wedding website', () => {
  let db;
  let server;
  let base;
  let ownerToken;
  let outsiderToken;
  let workspace;
  let ip = 0;

  const content = {
    id: 'site_1',
    welcome: { title: 'We are getting married', body: 'Join us!\n\n<script>alert(1)</script>' },
    events: [{ name: 'Ceremony', date: '2027-09-12', time: '3pm', place: 'Rose Garden', address: '1 Garden Way, Austin' }],
    travel: 'Fly into AUS.',
    stays: [{ name: 'Hotel Ella', url: 'https://hotel.example', notes: 'Use code SHAH' }],
    registry: [
      { name: 'Our registry', url: 'https://registry.example' },
      { name: 'Trap', url: 'javascript:alert(1)' },
    ],
    faq: [{ question: 'Can I bring kids?', answer: '" onerror="alert(1)' }],
  };

  before(async () => {
    db = openDatabase(':memory:');
    const owner = db.createUser({ email: 'p@example.com', name: 'Priya', passwordHash: 'x' });
    const outsider = db.createUser({ email: 'o@example.com', name: 'O', passwordHash: 'x' });
    ownerToken = db.createSession(owner.id, DAY).token;
    outsiderToken = db.createSession(outsider.id, DAY).token;
    workspace = db.workspaces.create(owner.id, 'W');
    db.sync.push(workspace.id, owner.id, [
      ['wedding', { id: 'wed_1', ownerName: 'Priya', partnerName: 'Sam', city: 'Austin', date: '2027-09-12', dateType: 'exact' }],
      ['website', content],
      ['guests', { id: 'g1', firstName: 'Meera', lastName: 'Secret-Shah', householdId: 'h1' }],
    ].map(([collection, data], i) => ({ mutationId: `seed_${i}`, collection, id: data.id, op: 'upsert', baseVersion: 0, data })));
    db.rsvp.saveSettings(workspace.id, { slug: 'priya-and-sam' });

    server = createAuthServer({ db, log: quiet, publicBaseUrl: 'https://rsvp.example.com' });
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => {
    server.close();
    db.close();
  });

  beforeEach(() => {
    ip += 1;
  });

  const headers = (extra = {}) => ({ 'X-Forwarded-For': `10.4.${Math.floor(ip / 250)}.${ip % 250}`, ...extra });
  const settings = (body, token = ownerToken) =>
    fetch(`${base}/v1/workspaces/${workspace.id}/site/settings`, {
      method: 'PUT',
      headers: headers({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
  const visit = (extra = {}) => fetch(`${base}/w/priya-and-sam`, { headers: headers(extra), redirect: 'manual' });
  const enterPassword = (password) =>
    fetch(`${base}/w/priya-and-sam`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/x-www-form-urlencoded' }),
      body: new URLSearchParams({ password }).toString(),
      redirect: 'manual',
    });

  it('is off until the couple publishes it', async () => {
    const response = await visit();
    assert.equal(response.status, 404);
    assert.match(await response.text(), /not published/);
  });

  it('settings are members only, and password visibility needs a password', async () => {
    assert.equal((await settings({ visibility: 'public' }, outsiderToken)).status, 404);
    const noPassword = await settings({ visibility: 'password' });
    assert.equal(noPassword.status, 400);
    assert.deepEqual(await noPassword.json(), { error: 'password_required' });
  });

  describe('public', () => {
    before(async () => {
      assert.equal((await settings({ visibility: 'public' })).status, 200);
    });

    it('shows the content, with an RSVP button and directions', async () => {
      const body = await (await visit()).text();
      for (const text of ['We are getting married', 'Priya &amp; Sam', 'Ceremony', 'Rose Garden', 'Fly into AUS.', 'Hotel Ella', 'Our registry', 'Can I bring kids?']) {
        assert.ok(body.includes(text), text);
      }
      assert.match(body, /href="\/w\/priya-and-sam\/rsvp"/);
      assert.match(body, /google\.com\/maps\/search\/\?api=1&amp;query=1%20Garden%20Way%2C%20Austin/);
      assert.match(body, /rel="noopener noreferrer nofollow"/);
    });

    it('escapes text and drops unsafe links (W3)', async () => {
      const body = await (await visit()).text();
      assert.ok(!body.includes('<script>alert(1)</script>'));
      assert.ok(body.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
      assert.ok(!body.includes('" onerror="'));
      assert.ok(!/javascript:/i.test(body));
      assert.ok(!body.includes('Trap'));
    });

    it('never shows guests (W7)', async () => {
      const body = await (await visit()).text();
      assert.ok(!body.includes('Meera') && !body.includes('Secret-Shah'));
    });

    it('is hidden from search engines unless the couple opts in (D9)', async () => {
      const hidden = await visit();
      assert.match(hidden.headers.get('x-robots-tag'), /noindex/);
      assert.match(await hidden.text(), /<meta name="robots" content="noindex/);

      await settings({ indexable: true });
      const listed = await visit();
      assert.equal(listed.headers.get('x-robots-tag'), null);
      assert.ok(!(await listed.text()).includes('name="robots"'));
      // Everything else stays locked down.
      assert.equal(listed.headers.get('x-frame-options'), 'DENY');
      await settings({ indexable: false });
    });
  });

  describe('password', () => {
    let cookie;

    before(async () => {
      assert.equal((await settings({ visibility: 'password', password: 'garden2027' })).status, 200);
    });

    it('asks for the password and shows nothing else', async () => {
      const body = await (await visit()).text();
      assert.match(body, /This page is private/);
      assert.ok(!body.includes('Rose Garden'));
    });

    it('a wrong password is refused', async () => {
      const wrong = await enterPassword('nope-nope');
      assert.equal(wrong.status, 400);
      assert.match(await wrong.text(), /not right/);
    });

    it('the right password sets a scoped, HTTP-only cookie that opens the page', async () => {
      const right = await enterPassword('garden2027');
      assert.equal(right.status, 303);
      assert.equal(right.headers.get('location'), '/w/priya-and-sam');
      const setCookie = right.headers.get('set-cookie');
      for (const part of ['HttpOnly', 'SameSite=Lax', 'Path=/w/priya-and-sam', 'Secure']) assert.ok(setCookie.includes(part), part);
      cookie = setCookie.split(';')[0];

      const page = await visit({ Cookie: cookie });
      assert.match(await page.text(), /Rose Garden/);
    });

    it('a forged or tampered cookie does not open it', async () => {
      for (const forged of ['wgpt_site=9999999999999.abc', `${cookie}x`, 'wgpt_site=']) {
        assert.match(await (await visit({ Cookie: forged })).text(), /This page is private/);
      }
    });

    it('a password-protected site is never indexed', async () => {
      await settings({ indexable: true });
      assert.match((await visit({ Cookie: cookie })).headers.get('x-robots-tag'), /noindex/);
    });

    it('changing the password signs everyone out', async () => {
      await settings({ password: 'new-password-2' });
      assert.match(await (await visit({ Cookie: cookie })).text(), /This page is private/);
    });

    it('slows password guessing', async () => {
      const statuses = [];
      for (let i = 0; i <= RSVP_RATE_LIMITS.passwordAttemptsPerIpPerHour; i += 1) {
        statuses.push((await enterPassword(`guess-${i}`)).status);
      }
      assert.equal(statuses.at(-1), 429);
    });
  });

  it('the RSVP code page keeps working under the same address', async () => {
    assert.equal((await fetch(`${base}/w/priya-and-sam/rsvp`, { headers: headers() })).status, 200);
  });
});
