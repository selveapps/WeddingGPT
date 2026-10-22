import { RsvpStatus } from '@/models';

import {
  CODE_LENGTH,
  buildInvitees,
  inviteMessage,
  parseRsvpReplies,
  repliesToChanges,
  rsvpCode,
  rsvpLink,
} from '../model';

const guests = [
  { id: 'g1', firstName: 'Ana', lastName: 'Ruiz', householdId: 'h1' },
  { id: 'g2', firstName: 'Luis', lastName: 'Ruiz', householdId: 'h1' },
  { id: 'g3', firstName: 'Kim', lastName: 'Park', householdId: null },
];
const households = [{ id: 'h1', name: 'The Ruiz family' }, { id: 'h2', name: 'Empty' }];

describe('rsvpCode', () => {
  it('is stable, readable and the right length', () => {
    expect(rsvpCode('h1')).toBe(rsvpCode('h1'));
    expect(rsvpCode('h1')).toHaveLength(CODE_LENGTH);
    expect(rsvpCode('h1')).toMatch(/^[A-HJKMNP-Z2-9]+$/);
  });

  it('spreads across many IDs without collisions in practice', () => {
    const codes = new Set(Array.from({ length: 2000 }, (_, i) => rsvpCode(`guest_${i}`)));
    expect(codes.size).toBe(2000);
  });
});

it('builds one invitee per non-empty household plus loose guests', () => {
  const invitees = buildInvitees(guests, households);
  expect(invitees.map((i) => i.name)).toEqual(['Kim Park', 'The Ruiz family']);
  expect(invitees[1].guestIds).toEqual(['g1', 'g2']);
});

it('adds the code to links and messages', () => {
  expect(rsvpLink('https://rsvp.example.com', 'ABC234')).toBe('https://rsvp.example.com?code=ABC234');
  expect(rsvpLink('https://x.co/r?w=1', 'ABC234')).toBe('https://x.co/r?w=1&code=ABC234');
  expect(rsvpLink('', 'ABC234')).toBeNull();
  const message = inviteMessage({ invitee: { name: 'Kim', code: 'ABC234' }, coupleName: 'Sam and Alex', link: null });
  expect(message).toContain('ABC234 yes 2');
});

describe('parseRsvpReplies', () => {
  const invitees = buildInvitees(guests, households);
  const ruiz = invitees.find((i) => i.key === 'h1');
  const kim = invitees.find((i) => i.key === 'g3');

  it('reads codes, statuses and counts out of chatty replies', () => {
    const { replies, errors } = parseRsvpReplies(
      `Hi!! ${ruiz.code} yes 1, so excited\n${kim.code.toLowerCase()} - regrets\nhello\nZZZZZZ yes`,
      invitees
    );
    expect(replies.map((r) => [r.invitee.key, r.status, r.count])).toEqual([
      ['h1', RsvpStatus.ATTENDING, 1],
      ['g3', RsvpStatus.DECLINED, null],
    ]);
    expect(errors.map((e) => e.reason)).toEqual(['No matching code', 'No matching code']);
  });

  it('turns a partial yes into attending plus declined', () => {
    const { replies } = parseRsvpReplies(`${ruiz.code} yes 1`, invitees);
    expect(repliesToChanges(replies)).toEqual([
      { guestId: 'g1', rsvpStatus: RsvpStatus.ATTENDING },
      { guestId: 'g2', rsvpStatus: RsvpStatus.DECLINED },
    ]);
  });

  it('flags a reply without a clear answer', () => {
    const { errors } = parseRsvpReplies(`${kim.code} see you there`, invitees);
    expect(errors[0].reason).toMatch(/yes or a no/);
  });
});
