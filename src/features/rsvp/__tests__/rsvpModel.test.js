import {
  SLUG_PATTERN,
  buildInvitees,
  codesCsv,
  inviteeStatus,
  publicBase,
  replySummary,
  suggestSlug,
  summariseInvitees,
} from '../rsvpModel';
import { createRsvpApi, RSVP_BATCH } from '@/services/rsvp';

const guests = [
  { id: 'g1', firstName: 'Meera', lastName: 'Shah', householdId: 'h1' },
  { id: 'g2', firstName: 'Ravi', lastName: 'Shah', householdId: 'h1' },
  { id: 'g3', firstName: 'Ana', lastName: 'Diaz' },
  { id: 'g4', firstName: 'Zed', householdId: 'h_empty_name' },
];
const households = [
  { id: 'h1', name: 'The Shahs' },
  { id: 'h_empty_name', name: '' },
  { id: 'h_nobody', name: 'Nobody here' },
];

describe('buildInvitees', () => {
  it('invites households with guests, and guests without one, by name', () => {
    expect(buildInvitees(guests, households).map((i) => [i.type, i.id, i.name, i.guestIds])).toEqual([
      ['guest', 'g3', 'Ana Diaz', ['g3']],
      ['household', 'h1', 'The Shahs', ['g1', 'g2']],
      ['household', 'h_empty_name', 'Zed', ['g4']],
    ]);
  });
});

describe('suggestSlug', () => {
  it('builds a page address from the couple names', () => {
    expect(suggestSlug({ ownerName: 'Priya', partnerName: 'Sam' })).toBe('priya-and-sam');
    expect(suggestSlug({ ownerName: 'José', partnerName: 'Zoë' })).toBe('jose-and-zoe');
    expect(suggestSlug({ ownerName: '  ' })).toBe('our-wedding');
    expect(suggestSlug({ ownerName: 'A'.repeat(60) })).toHaveLength(40);
    for (const slug of ['priya-and-sam', 'jose-and-zoe', 'our-wedding'])
      expect(SLUG_PATTERN.test(slug)).toBe(true);
  });
});

describe('inviteeStatus', () => {
  const invitee = { type: 'household', id: 'h1' };
  const invite = { id: 'inv1', targetType: 'household', targetId: 'h1', revoked: false, openedAt: null };
  const link = { url: 'https://rsvp.example.com/r/tok', code: 'ABCD-EFGH' };

  it('moves from no link, to sent, to opened, to replied', () => {
    expect(inviteeStatus(invitee, {}).status).toBe('none');
    expect(inviteeStatus(invitee, { invites: [invite], links: { inv1: link } })).toMatchObject({
      status: 'sent',
      link,
    });
    expect(inviteeStatus(invitee, { invites: [{ ...invite, openedAt: 'x' }] }).status).toBe('opened');
    expect(
      inviteeStatus(invitee, { invites: [invite], responses: [{ targetType: 'household', targetId: 'h1' }] })
        .status
    ).toBe('replied');
  });

  it('knows a link was made on another phone when this one has no copy', () => {
    expect(inviteeStatus(invitee, { invites: [invite], links: {} })).toMatchObject({
      status: 'sent',
      link: null,
    });
  });
});

describe('summaries and exports', () => {
  it('counts invitees by status', () => {
    const invitees = buildInvitees(guests, households);
    const statusFor = (i) => ({ status: i.id === 'h1' ? 'replied' : 'none' });
    expect(summariseInvitees(invitees, statusFor)).toEqual({
      total: 3,
      none: 2,
      sent: 0,
      opened: 0,
      replied: 1,
    });
  });

  it('summarises a reply', () => {
    expect(replySummary({ guests: [{ attending: true }, { attending: true }] })).toBe('2 coming');
    expect(replySummary({ guests: [{ attending: false }] })).toBe('1 not coming');
    expect(replySummary({ guests: [{ attending: true }, { attending: false }] })).toBe('1 coming, 1 not');
  });

  it('exports codes and links for printing', () => {
    const invitees = buildInvitees(guests, households);
    const link = { url: 'https://rsvp.example.com/r/tok1', code: 'ABCD-EFGH' };
    const statusFor = (i) => ({ link: i.id === 'h1' ? link : null });
    expect(codesCsv(invitees, statusFor, { base: 'https://rsvp.example.com', slug: 'priya-and-sam' })).toBe(
      'Name,Code,Link,Or type the code at\nThe Shahs,ABCD-EFGH,https://rsvp.example.com/r/tok1,https://rsvp.example.com/w/priya-and-sam/rsvp'
    );
  });

  it('reads the public site base from a link', () => {
    expect(publicBase({ a: { url: 'https://rsvp.example.com/r/abc' } })).toBe('https://rsvp.example.com');
    expect(publicBase({})).toBeNull();
  });
});

describe('createRsvpApi', () => {
  it('creates invites in batches the server accepts', async () => {
    const client = {
      createRsvpInvites: jest.fn(async (token, ws, batch) => batch.map((t) => ({ targetId: t.id }))),
    };
    const api = createRsvpApi({ client, getToken: () => 'tok', getWorkspaceId: () => 'ws_1' });
    const targets = Array.from({ length: RSVP_BATCH + 5 }, (_, i) => ({ type: 'guest', id: `g${i}` }));
    const created = await api.createInvites(targets);
    expect(created).toHaveLength(RSVP_BATCH + 5);
    expect(client.createRsvpInvites).toHaveBeenCalledTimes(2);
    expect(client.createRsvpInvites.mock.calls[0].slice(0, 2)).toEqual(['tok', 'ws_1']);
  });
});
