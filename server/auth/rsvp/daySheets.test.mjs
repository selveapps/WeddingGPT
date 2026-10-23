import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createAuthServer } from '../app.mjs';
import { openDatabase } from '../db.mjs';
import { DAY_SHEET_LIMITS, expiryFor, validateDaySheet } from './daySheets.mjs';

const quiet = { info() {}, error() {} };
const DAY = 24 * 60 * 60 * 1000;

describe('day-sheet rules', () => {
  it('validates requests', () => {
    assert.equal(
      validateDaySheet({ label: 'Rosewood Florals', eventId: 'ev_1', contactIds: ['party_1'] }),
      null
    );
    assert.deepEqual(validateDaySheet({ label: ' ' }), { label: 'required' });
    assert.deepEqual(validateDaySheet({ label: 'x'.repeat(DAY_SHEET_LIMITS.labelChars + 1) }), {
      label: 'too_long',
    });
    assert.deepEqual(validateDaySheet({ label: 'Ok', eventId: 'has space' }), { eventId: 'invalid' });
    assert.deepEqual(validateDaySheet({ label: 'Ok', contactIds: 'party_1' }), { contactIds: 'invalid' });
    const many = Array.from({ length: DAY_SHEET_LIMITS.contacts + 1 }, (_, i) => `p${i}`);
    assert.deepEqual(validateDaySheet({ label: 'Ok', contactIds: many }), { contactIds: 'invalid' });
  });

  it('expires a week after the event, or in a few months without a date', () => {
    const now = new Date('2027-01-01T00:00:00Z');
    assert.equal(expiryFor('2027-05-08', now), '2027-05-15T23:59:59.000Z');
    assert.equal(expiryFor(null, now), new Date(now.getTime() + 120 * DAY).toISOString());
    // A date already past does not make a link that is dead on arrival.
    assert.equal(expiryFor('2026-01-01', now), new Date(now.getTime() + 120 * DAY).toISOString());
  });
});

describe('day-of sheets (F3)', () => {
  let db;
  let server;
  let base;
  let owner;
  let outsider;
  let workspace;
  let other;
  let ip = 0;

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
    const ownerUser = db.createUser({ email: 'priya@example.com', name: 'Priya', passwordHash: 'x' });
    const outsiderUser = db.createUser({ email: 'o@example.com', name: 'O', passwordHash: 'x' });
    owner = db.createSession(ownerUser.id, DAY).token;
    outsider = db.createSession(outsiderUser.id, DAY).token;
    workspace = db.workspaces.create(ownerUser.id, 'Priya and Sam');
    other = db.workspaces.create(outsiderUser.id, 'Someone else');
    seed(workspace.id, ownerUser.id, [
      [
        'wedding',
        {
          id: 'wed_1',
          ownerName: 'Priya',
          partnerName: 'Sam',
          date: '2099-05-08',
          dateType: 'exact',
          venueName: 'The Hall',
        },
      ],
      [
        'events',
        {
          id: 'ev_mehndi',
          name: '<script>alert(1)</script>',
          date: '2099-05-07',
          startTime: '18:00',
          venueName: 'The Courtyard',
          address: '1 Garden Lane',
          dressCode: 'Bright',
          guestScope: 'invited',
          invitedGuestIds: ['g_meera'],
        },
      ],
      [
        'runOfShow',
        {
          id: 'ros_1',
          eventId: 'ev_mehndi',
          title: 'Henna for the bride',
          start: 1080,
          durationMin: 120,
          location: 'Terrace',
          owner: 'Artist',
        },
      ],
      [
        'runOfShow',
        { id: 'ros_2', eventId: 'ev_mehndi', title: 'Music starts', start: 1140, durationMin: 0 },
      ],
      ['runOfShow', { id: 'ros_3', eventId: null, title: 'Ceremony', start: 960, durationMin: 30 }],
      [
        'partyMembers',
        {
          id: 'party_maya',
          name: 'Maya',
          roleKey: 'maid_of_honor',
          phone: '+1 555 0101',
          email: 'maya@example.com',
        },
      ],
      ['partyMembers', { id: 'party_raj', name: 'Raj', roleKey: 'best_man', phone: '+1 555 0102' }],
      ['guests', { id: 'g_meera', firstName: 'Meera', lastName: 'Shah', phone: '555 0100' }],
      ['expenses', { id: 'exp_1', title: 'Henna artist', amount: 30000 }],
    ]);
    seed(other.id, outsiderUser.id, [['events', { id: 'ev_other', name: 'Their party' }]]);

    server = createAuthServer({
      db,
      log: quiet,
      publicBaseUrl: 'https://rsvp.example.com/',
      appToken: 'app-secret',
    });
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

  const address = () => `10.4.${Math.floor(ip / 250)}.${ip % 250}`;
  const api = (method, path, { token = owner, body } = {}) =>
    fetch(`${base}${path}`, {
      method,
      headers: {
        'X-Forwarded-For': address(),
        'X-App-Token': 'app-secret',
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  const open = (path, fromIp = address()) =>
    fetch(`${base}${path}`, { headers: { 'X-Forwarded-For': fromIp } });
  const create = async (body, workspaceId = workspace.id, token = owner) => {
    const response = await api('POST', `/v1/workspaces/${workspaceId}/daysheets`, { token, body });
    return { status: response.status, json: await response.json() };
  };
  const pathOf = (url) => new URL(url).pathname;

  it('makes a link on the public address and never shows the token again (D1)', async () => {
    const { status, json } = await create({
      eventId: 'ev_mehndi',
      label: 'Rosewood Florals',
      contactIds: ['party_maya'],
    });
    assert.equal(status, 201);
    assert.match(json.url, /^https:\/\/rsvp\.example\.com\/d\/[A-Za-z0-9_-]{22}$/);
    assert.equal(json.sheet.label, 'Rosewood Florals');
    assert.equal(json.sheet.workspaceId, undefined);

    const listed = await (await api('GET', `/v1/workspaces/${workspace.id}/daysheets`)).json();
    const text = JSON.stringify(listed);
    assert.ok(!text.includes(pathOf(json.url).split('/d/')[1]));
    assert.ok(!/token/i.test(text));
  });

  it('shows the event, its run of show and the chosen contacts - nothing else (D2, D3)', async () => {
    const { json } = await create({
      eventId: 'ev_mehndi',
      label: 'Rosewood Florals',
      contactIds: ['party_maya'],
    });
    const response = await open(pathOf(json.url));
    assert.equal(response.status, 200);
    const body = await response.text();
    assert.match(body, /Day-of sheet for Rosewood Florals/);
    assert.match(body, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.doesNotMatch(body, /<script>/);
    assert.match(body, /1 Garden Lane/);
    assert.match(body, /6:00 PM<\/strong> - 8:00 PM Henna for the bride/);
    assert.match(body, /Music starts/);
    assert.match(body, /Maya <span class="muted">\(Maid of honor\)<\/span> - <a href="tel:\+15550101">/);
    // Not the wedding day's schedule, nor anyone the couple did not tick, nor guests, money or email.
    for (const hidden of [
      'Ceremony',
      'Raj',
      'Meera',
      '555 0100',
      'Henna artist',
      '30000',
      'maya@example.com',
      'g_meera',
    ]) {
      assert.ok(!body.includes(hidden), `page shows ${hidden}`);
    }
  });

  it('sends the protective headers (D4)', async () => {
    const { json } = await create({ eventId: null, label: 'Photographer', contactIds: [] });
    const response = await open(pathOf(json.url));
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    assert.match(response.headers.get('x-robots-tag'), /noindex/);
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.match(response.headers.get('content-security-policy'), /script-src 'none'|default-src 'none'/);
    // The wedding day's sheet uses the wedding's details and its own schedule.
    const body = await response.text();
    assert.match(body, /The wedding day/);
    assert.match(body, /Ceremony/);
    assert.doesNotMatch(body, /Henna for the bride/);
  });

  it('turns off when revoked, and records when it was opened (D5)', async () => {
    const { json } = await create({ eventId: 'ev_mehndi', label: 'DJ', contactIds: [] });
    await open(pathOf(json.url));
    const listed = (await (await api('GET', `/v1/workspaces/${workspace.id}/daysheets`)).json()).sheets;
    assert.ok(listed.find((sheet) => sheet.id === json.sheet.id).lastOpenedAt);

    assert.equal(
      (await api('POST', `/v1/workspaces/${workspace.id}/daysheets/${json.sheet.id}/revoke`)).status,
      204
    );
    assert.equal((await open(pathOf(json.url))).status, 404);
    assert.equal(
      (await api('POST', `/v1/workspaces/${workspace.id}/daysheets/${json.sheet.id}/revoke`)).status,
      404
    );
  });

  it('turns off after it expires, and when its event is deleted (D5)', async () => {
    const sheet = db.daySheets.create(workspace.id, { eventId: 'ev_mehndi', label: 'Late', contactIds: [] });
    assert.ok(db.daySheets.findByToken(sheet.token));
    assert.equal(db.daySheets.findByToken(sheet.token, { now: new Date('2099-06-01T00:00:00Z') }), null);

    seed(other.id, 'u', [['events', { id: 'ev_temp', name: 'Temp' }]]);
    const temp = db.daySheets.create(other.id, { eventId: 'ev_temp', label: 'Temp', contactIds: [] });
    db.sync.push(other.id, 'u', [
      { mutationId: `del_${Date.now()}`, collection: 'events', id: 'ev_temp', op: 'delete', baseVersion: 1 },
    ]);
    assert.equal(db.daySheets.content(db.daySheets.findByToken(temp.token)), null);
  });

  it('refuses made-up and malformed tokens the same way (D1)', async () => {
    for (const token of ['x'.repeat(22), 'not-a-real-token', 'a'.repeat(500)]) {
      assert.equal((await open(`/d/${token}`)).status, 404);
    }
  });

  it('only members make, list or revoke links, and only for their own wedding (D6)', async () => {
    const { json } = await create({ eventId: 'ev_mehndi', label: 'Florist', contactIds: [] });
    assert.equal((await create({ label: 'Nope' }, workspace.id, outsider)).status, 404);
    assert.equal(
      (await api('GET', `/v1/workspaces/${workspace.id}/daysheets`, { token: outsider })).status,
      404
    );
    const revoke = await api('POST', `/v1/workspaces/${other.id}/daysheets/${json.sheet.id}/revoke`, {
      token: outsider,
    });
    assert.equal(revoke.status, 404);
    assert.equal((await open(pathOf(json.url))).status, 200);
    // Another wedding's event cannot be named.
    assert.deepEqual((await create({ eventId: 'ev_other', label: 'Sneaky' })).json, {
      error: 'event_not_found',
    });
    // Contacts from another wedding are not shown even if their id is given.
    seed(other.id, 'u', [['partyMembers', { id: 'party_theirs', name: 'Theirs', phone: '999' }]]);
    const mixed = await create({ eventId: null, label: 'Mixed', contactIds: ['party_theirs', 'party_raj'] });
    const body = await (await open(pathOf(mixed.json.url))).text();
    assert.match(body, /Raj/);
    assert.doesNotMatch(body, /Theirs/);
  });

  it('limits links per wedding and page loads per address', async () => {
    const live = () => db.daySheets.list(workspace.id).filter((sheet) => !sheet.revokedAt).length;
    while (live() < DAY_SHEET_LIMITS.perWedding) {
      db.daySheets.create(workspace.id, { eventId: null, label: 'Filler', contactIds: [] });
    }
    const over = await create({ eventId: null, label: 'One too many', contactIds: [] });
    assert.equal(over.status, 403);
    assert.deepEqual(over.json, { error: 'limit_reached' });

    // Making links shares the per-address limit with sign-in.
    const made = [];
    for (let i = 0; i < 12; i += 1) {
      const response = await fetch(`${base}/v1/workspaces/${workspace.id}/daysheets`, {
        method: 'POST',
        headers: {
          'X-Forwarded-For': '10.250.9.8',
          'X-App-Token': 'app-secret',
          Authorization: `Bearer ${owner}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ label: 'x' }),
      });
      made.push(response.status);
    }
    assert.ok(made.includes(429));

    const results = [];
    for (let i = 0; i < 65; i += 1) results.push((await open('/d/whatever', '10.250.9.9')).status);
    assert.ok(results.includes(429));
  });
});
