import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createAuthServer } from '../app.mjs';
import { openDatabase } from '../db.mjs';
import { escapeHtml, html, raw } from './html.mjs';
import { RSVP_RATE_LIMITS } from './routes.mjs';
import { normaliseCode, repliesOpen, validateSettings } from './rsvp.mjs';

const quiet = { info() {}, error() {} };
const DAY = 86400000;
const isoDay = (offsetDays) => new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);

describe('html', () => {
  it('escapes every interpolated value (W3)', () => {
    const name = '<script>alert(1)</script>';
    const attr = '" onerror="alert(1)';
    assert.equal(
      String(html`<p title="${attr}">${name}</p>`),
      '<p title="&quot; onerror=&quot;alert(1)">&lt;script&gt;alert(1)&lt;/script&gt;</p>'
    );
    assert.equal(escapeHtml("`'&"), '&#96;&#39;&amp;');
  });

  it('nests safe fragments and lists, and skips empty values', () => {
    const items = ['a<', 'b'].map((x) => html`<li>${x}</li>`);
    assert.equal(String(html`<ul>${items}</ul>${null}${false}${raw('<hr>')}`), '<ul><li>a&lt;</li><li>b</li></ul><hr>');
  });
});

describe('rules', () => {
  it('validates settings', () => {
    assert.equal(validateSettings({ slug: 'priya-and-sam', deadline: '2027-08-01', questions: { meals: false } }), null);
    assert.deepEqual(validateSettings({ slug: 'Priya Sam' }), { slug: 'invalid' });
    assert.deepEqual(validateSettings({ slug: 'admin' }), { slug: 'reserved' });
    assert.deepEqual(validateSettings({ slug: '-x-' }), { slug: 'invalid' });
    assert.deepEqual(validateSettings({ deadline: 'soon' }), { deadline: 'invalid' });
    assert.deepEqual(validateSettings({ questions: { songs: true } }), { questions: 'invalid' });
    assert.deepEqual(validateSettings({ questions: { meals: 'yes' } }), { questions: 'invalid' });
  });

  it('reads codes the way people type them', () => {
    assert.equal(normaliseCode(' abcd-efgh '), 'ABCDEFGH');
  });

  it('closes replies after the deadline day', () => {
    assert.equal(repliesOpen({ deadline: null }), true);
    assert.equal(repliesOpen({ deadline: '2027-08-01' }, new Date('2027-08-01T20:00:00Z')), true);
    assert.equal(repliesOpen({ deadline: '2027-08-01' }, new Date('2027-08-02T00:00:01Z')), false);
  });
});

describe('RSVP site', () => {
  let db;
  let server;
  let base;
  let ownerToken;
  let outsiderToken;
  let workspace;
  let other;
  let ip = 0;

  /** Seed the couple's synced data, as their app would push it. */
  function seed(workspaceId, userId, records) {
    db.sync.push(
      workspaceId,
      userId,
      records.map(([collection, data], i) => ({
        mutationId: `seed_${workspaceId}_${i}_${Math.random().toString(36).slice(2)}`,
        collection,
        id: data.id,
        op: 'upsert',
        baseVersion: 0,
        data,
      }))
    );
  }

  before(async () => {
    db = openDatabase(':memory:');
    const owner = db.createUser({ email: 'priya@example.com', name: 'Priya', passwordHash: 'x' });
    const outsider = db.createUser({ email: 'o@example.com', name: 'O', passwordHash: 'x' });
    ownerToken = db.createSession(owner.id, DAY).token;
    outsiderToken = db.createSession(outsider.id, DAY).token;
    workspace = db.workspaces.create(owner.id, 'Priya and Sam');
    other = db.workspaces.create(outsider.id, 'Someone else');

    seed(workspace.id, owner.id, [
      ['wedding', { id: 'wed_1', ownerName: 'Priya', partnerName: '"><img src=x onerror=alert(1)>', city: 'Austin', date: '2027-09-12', dateType: 'exact' }],
      ['households', { id: 'hh_shah', name: 'The Shahs' }],
      ['households', { id: 'hh_lee', name: 'The Lees' }],
      ['guests', { id: 'g_meera', firstName: 'Meera', lastName: 'Shah', householdId: 'hh_shah', plusOneStatus: 'allowed', phone: '555 0100' }],
      ['guests', { id: 'g_ravi', firstName: '<script>alert(1)</script>', householdId: 'hh_shah' }],
      ['guests', { id: 'g_jo', firstName: 'Jo', lastName: 'Lee', householdId: 'hh_lee' }],
      ['guests', { id: 'g_solo', firstName: 'Ana' }],
    ]);
    seed(other.id, outsider.id, [['guests', { id: 'g_x', firstName: 'Xavier', householdId: 'hh_x' }]]);

    server = createAuthServer({ db, log: quiet, publicBaseUrl: 'https://rsvp.example.com/', appToken: 'app-secret' });
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

  const headers = (extra = {}) => ({ 'X-Forwarded-For': `10.3.${Math.floor(ip / 250)}.${ip % 250}`, ...extra });
  const api = (method, path, { token = ownerToken, body } = {}) =>
    fetch(`${base}${path}`, {
      method,
      headers: headers({
        'X-App-Token': 'app-secret',
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      }),
      body: body ? JSON.stringify(body) : undefined,
    });
  const page = (path) => fetch(`${base}${path}`, { headers: headers() });
  const postForm = (path, fields) =>
    fetch(`${base}${path}`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/x-www-form-urlencoded' }),
      body: new URLSearchParams(fields).toString(),
    });
  const tokenFrom = (url) => url.split('/r/')[1];
  const inviteFor = async (targets, workspaceId = workspace.id, token = ownerToken) => {
    const response = await api('POST', `/v1/workspaces/${workspaceId}/rsvp/invites`, { token, body: { targets } });
    assert.equal(response.status, 201);
    return (await response.json()).invites;
  };

  describe('settings', () => {
    it('saves settings and refuses a taken slug', async () => {
      const saved = await api('PUT', `/v1/workspaces/${workspace.id}/rsvp/settings`, {
        body: { slug: 'priya-and-sam', deadline: isoDay(30) },
      });
      assert.equal(saved.status, 200);
      assert.equal((await saved.json()).settings.questions.meals, true);

      const taken = await api('PUT', `/v1/workspaces/${other.id}/rsvp/settings`, {
        token: outsiderToken,
        body: { slug: 'priya-and-sam' },
      });
      assert.equal(taken.status, 409);
      const bad = await api('PUT', `/v1/workspaces/${workspace.id}/rsvp/settings`, { body: { slug: 'RSVP!' } });
      assert.equal(bad.status, 400);
    });

    it('is members only', async () => {
      assert.equal((await api('GET', `/v1/workspaces/${workspace.id}/rsvp/settings`, { token: outsiderToken })).status, 404);
      assert.equal(
        (await api('POST', `/v1/workspaces/${workspace.id}/rsvp/invites`, { token: outsiderToken, body: { targets: [{ type: 'guest', id: 'g_solo' }] } })).status,
        404
      );
    });
  });

  describe('invites', () => {
    it('returns a link on the public domain and a readable code, once', async () => {
      const [invite] = await inviteFor([{ type: 'household', id: 'hh_shah' }]);
      assert.match(invite.url, /^https:\/\/rsvp\.example\.com\/r\/[A-Za-z0-9_-]{22}$/);
      assert.match(invite.code, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      const list = await (await api('GET', `/v1/workspaces/${workspace.id}/rsvp/invites`)).json();
      assert.ok(list.invites.some((i) => i.id === invite.inviteId));
      assert.ok(!JSON.stringify(list).includes(tokenFrom(invite.url)), 'tokens are never listed again');
    });

    it('rejects bad target lists', async () => {
      for (const targets of [[], [{ type: 'table', id: 'x' }], [{ type: 'guest', id: '../x' }], 'all']) {
        assert.equal((await api('POST', `/v1/workspaces/${workspace.id}/rsvp/invites`, { body: { targets } })).status, 400);
      }
    });

    it('reissuing or revoking turns the old link off', async () => {
      const [first] = await inviteFor([{ type: 'guest', id: 'g_solo' }]);
      const [second] = await inviteFor([{ type: 'guest', id: 'g_solo' }]);
      assert.equal((await page(`/r/${tokenFrom(first.url)}`)).status, 404);
      assert.equal((await page(`/r/${tokenFrom(second.url)}`)).status, 200);

      const revoked = await api('POST', `/v1/workspaces/${workspace.id}/rsvp/invites/${second.inviteId}/revoke`);
      assert.equal(revoked.status, 204);
      const gone = await page(`/r/${tokenFrom(second.url)}`);
      assert.equal(gone.status, 404);
      assert.match(await gone.text(), /no longer active/);
    });
  });

  describe('the guest form', () => {
    it('shows only the invitation’s own guests, by first name (W2)', async () => {
      const [invite] = await inviteFor([{ type: 'household', id: 'hh_shah' }]);
      const body = await (await page(`/r/${tokenFrom(invite.url)}`)).text();
      assert.match(body, /Meera/);
      assert.ok(!body.includes('Shah</'), 'no last names');
      // Jo is in another household: neither their name field nor their id may appear.
      assert.ok(!body.includes('<legend>Jo</legend>'), 'no other households');
      assert.ok(!body.includes('g_jo'), 'no other households');
      assert.ok(!body.includes('555 0100'), 'no contact details');
      assert.match(body, /Bringing a guest\?/);
    });

    it('escapes names that look like markup (W3)', async () => {
      const [invite] = await inviteFor([{ type: 'household', id: 'hh_shah' }]);
      const body = await (await page(`/r/${tokenFrom(invite.url)}`)).text();
      assert.ok(!body.includes('<script>alert(1)</script>'));
      assert.ok(body.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
      assert.ok(!body.includes('<img src=x'));
    });

    it('sends protective headers on every page (W6, W7)', async () => {
      const [invite] = await inviteFor([{ type: 'guest', id: 'g_solo' }]);
      for (const response of [await page(`/r/${tokenFrom(invite.url)}`), await page('/r/not-a-real-token-at-all')]) {
        assert.match(response.headers.get('content-security-policy'), /default-src 'none'/);
        assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
        assert.equal(response.headers.get('x-frame-options'), 'DENY');
        assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
        assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
        assert.match(response.headers.get('x-robots-tag'), /noindex/);
      }
    });

    it('records a reply without touching the guest records (W10), and accepts changes', async () => {
      const [invite] = await inviteFor([{ type: 'household', id: 'hh_shah' }]);
      const path = `/r/${tokenFrom(invite.url)}`;
      const guestsBefore = db.sync.liveRecords(workspace.id, 'guests').map((r) => [r.id, r.version]);

      const missing = await postForm(path, { submit: '1', attending_g_meera: 'yes' });
      assert.equal(missing.status, 400);
      assert.match(await missing.text(), /Please choose yes or no/);

      const sent = await postForm(path, {
        submit: '1',
        attending_g_meera: 'yes',
        meal_g_meera: 'vegetarian',
        dietary_g_meera: 'no nuts',
        plusone_g_meera: 'Anika',
        attending_g_ravi: 'no',
        message: 'So happy for you!',
        // Not on this invitation: must be ignored (W2).
        attending_g_jo: 'yes',
      });
      assert.equal(sent.status, 200);
      assert.match(await sent.text(), /your reply is in/);

      const record = db.sync.getRecord(workspace.id, 'rsvpResponses', `rsvp_${invite.inviteId}`);
      assert.equal(record.updatedBy, `rsvp:${invite.inviteId}`);
      assert.deepEqual(
        record.data.guests.map((g) => [g.guestId, g.attending, g.meal, g.plusOneName]),
        [
          ['g_meera', true, 'vegetarian', 'Anika'],
          ['g_ravi', false, null, ''],
        ]
      );
      assert.equal(record.data.message, 'So happy for you!');
      assert.deepEqual(db.sync.liveRecords(workspace.id, 'guests').map((r) => [r.id, r.version]), guestsBefore);

      // Coming back shows the reply, and a change replaces it.
      assert.match(await (await page(path)).text(), /We have your reply/);
      await postForm(path, { submit: '1', attending_g_meera: 'no', attending_g_ravi: 'no' });
      const changed = db.sync.getRecord(workspace.id, 'rsvpResponses', `rsvp_${invite.inviteId}`);
      assert.equal(changed.version, 2);
      assert.equal(changed.data.guests[0].attending, false);
    });

    it('rejects meals not on the list', async () => {
      const [invite] = await inviteFor([{ type: 'guest', id: 'g_solo' }]);
      const response = await postForm(`/r/${tokenFrom(invite.url)}`, {
        submit: '1',
        attending_g_solo: 'yes',
        meal_g_solo: '<b>steak</b>',
      });
      assert.equal(response.status, 400);
    });

    it('stops accepting replies after the deadline', async () => {
      await api('PUT', `/v1/workspaces/${workspace.id}/rsvp/settings`, { body: { deadline: isoDay(-2) } });
      try {
        const [invite] = await inviteFor([{ type: 'guest', id: 'g_solo' }]);
        const path = `/r/${tokenFrom(invite.url)}`;
        assert.match(await (await page(path)).text(), /Replies have closed/);
        await postForm(path, { submit: '1', attending_g_solo: 'yes' });
        assert.equal(db.sync.getRecord(workspace.id, 'rsvpResponses', `rsvp_${invite.inviteId}`), null);
      } finally {
        await api('PUT', `/v1/workspaces/${workspace.id}/rsvp/settings`, { body: { deadline: isoDay(30) } });
      }
    });

    it('turns links off 30 days after the deadline', async () => {
      await api('PUT', `/v1/workspaces/${workspace.id}/rsvp/settings`, { body: { deadline: isoDay(-31) } });
      try {
        const [invite] = await inviteFor([{ type: 'guest', id: 'g_solo' }]);
        assert.equal((await page(`/r/${tokenFrom(invite.url)}`)).status, 404);
      } finally {
        await api('PUT', `/v1/workspaces/${workspace.id}/rsvp/settings`, { body: { deadline: isoDay(30) } });
      }
    });
  });

  describe('guessing (W1)', () => {
    it('refuses made-up tokens', async () => {
      for (const token of ['x', 'A'.repeat(22), 'not-a-real-token-at-all']) {
        assert.equal((await page(`/r/${token}`)).status, 404);
      }
    });

    it('a code works only on its own wedding’s page', async () => {
      await api('PUT', `/v1/workspaces/${other.id}/rsvp/settings`, { token: outsiderToken, body: { slug: 'someone-else' } });
      const [invite] = await inviteFor([{ type: 'household', id: 'hh_lee' }]);

      const here = await postForm('/w/priya-and-sam/rsvp', { code: invite.code.toLowerCase() });
      assert.equal(here.status, 200);
      assert.match(await here.text(), /Jo/);

      ip += 1;
      const elsewhere = await postForm('/w/someone-else/rsvp', { code: invite.code });
      assert.equal(elsewhere.status, 400);
    });

    it('a guest can reply through the code page', async () => {
      const [invite] = await inviteFor([{ type: 'household', id: 'hh_lee' }]);
      const sent = await postForm('/w/priya-and-sam/rsvp', { code: invite.code, submit: '1', attending_g_jo: 'yes' });
      assert.equal(sent.status, 200);
      assert.ok(db.sync.getRecord(workspace.id, 'rsvpResponses', `rsvp_${invite.inviteId}`));
    });

    it('slows code guessing per address', async () => {
      const statuses = [];
      for (let i = 0; i <= RSVP_RATE_LIMITS.codeAttemptsPerIpPerHour; i += 1) {
        statuses.push((await postForm('/w/priya-and-sam/rsvp', { code: 'ZZZZ-ZZZZ' })).status);
      }
      assert.equal(statuses.at(-1), 429);
      assert.ok(statuses.slice(0, -1).every((status) => status === 400));
    });

    it('slows code guessing per wedding, across addresses', async () => {
      await api('PUT', `/v1/workspaces/${other.id}/rsvp/settings`, { token: outsiderToken, body: { slug: 'someone-else' } });
      let last;
      for (let i = 0; i <= RSVP_RATE_LIMITS.codeAttemptsPerWeddingPerHour; i += 1) {
        ip += 1;
        last = (await postForm('/w/someone-else/rsvp', { code: 'ZZZZ-ZZZZ' })).status;
      }
      assert.equal(last, 429);
    });

    it('an unknown wedding page is a 404', async () => {
      assert.equal((await page('/w/nobody-here/rsvp')).status, 404);
    });
  });

  describe('boundaries', () => {
    it('devices cannot write replies through sync', async () => {
      const response = await api('POST', `/v1/workspaces/${workspace.id}/sync/push`, {
        body: {
          mutations: [
            { mutationId: 'mut_forge', collection: 'rsvpResponses', id: 'rsvp_forged', op: 'upsert', baseVersion: 0, data: {} },
          ],
        },
      });
      assert.deepEqual((await response.json()).rejected, [{ mutationId: 'mut_forge', error: 'read_only' }]);
    });

    it('guest pages work without the app token, the API does not', async () => {
      const [invite] = await inviteFor([{ type: 'guest', id: 'g_solo' }]);
      assert.equal((await page(`/r/${tokenFrom(invite.url)}`)).status, 200);
      const noToken = await fetch(`${base}/v1/workspaces/${workspace.id}/rsvp/invites`, {
        headers: headers({ Authorization: `Bearer ${ownerToken}` }),
      });
      assert.equal(noToken.status, 401);
    });
  });
});
