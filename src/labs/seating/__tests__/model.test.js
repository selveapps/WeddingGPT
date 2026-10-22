import { RsvpStatus } from '@/models';

import { assignGuest, autoSeat, findConflicts, seatingSummary, unseatedGuests } from '../model';

const table = (id, capacity, guestIds = []) => ({ id, name: `T${id}`, capacity, guestIds });
const guest = (id, householdId = null, rsvpStatus = RsvpStatus.ATTENDING) => ({
  id,
  firstName: id,
  householdId,
  rsvpStatus,
});

describe('assignGuest', () => {
  it('moves a guest between tables', () => {
    const { tables } = assignGuest([table('a', 2, ['g1']), table('b', 2)], 'b', 'g1');
    expect(tables[0].guestIds).toEqual([]);
    expect(tables[1].guestIds).toEqual(['g1']);
  });

  it('refuses a full table and leaves seating alone', () => {
    const before = [table('a', 1, ['g1']), table('b', 2, ['g2'])];
    const result = assignGuest(before, 'a', 'g2');
    expect(result.error).toMatch(/full/);
    expect(result.tables).toBe(before);
  });
});

it('skips declined guests when listing who needs a seat', () => {
  const guests = [guest('g1'), guest('g2', null, RsvpStatus.DECLINED), guest('g3')];
  expect(unseatedGuests([table('a', 4, ['g1'])], guests).map((g) => g.id)).toEqual(['g3']);
});

describe('autoSeat', () => {
  it('keeps a household together at the roomiest table', () => {
    const guests = [guest('a1', 'h1'), guest('a2', 'h1'), guest('a3', 'h1'), guest('solo')];
    const result = autoSeat([table('small', 2), table('big', 4)], guests);
    expect(result.tables[1].guestIds.slice(0, 3)).toEqual(['a1', 'a2', 'a3']);
    expect(result.placed).toBe(4);
    expect(result.unplaced).toEqual([]);
  });

  it('splits a household that fits nowhere whole, and reports overflow', () => {
    const guests = [guest('a1', 'h'), guest('a2', 'h'), guest('a3', 'h')];
    const result = autoSeat([table('x', 2), table('y', 0)], guests);
    expect(result.placed).toBe(2);
    expect(result.unplaced).toEqual(['a3']);
  });

  it('never seats an avoid-pair together', () => {
    const guests = [guest('ex1'), guest('ex2')];
    const result = autoSeat([table('a', 4), table('b', 4)], guests, { avoidPairs: [['ex1', 'ex2']] });
    expect(findConflicts(result.tables, [['ex2', 'ex1']])).toEqual([]);
    expect(result.placed).toBe(2);
  });

  it('leaves existing seats where they are', () => {
    const result = autoSeat([table('a', 2, ['g1'])], [guest('g1'), guest('g2')]);
    expect(result.tables[0].guestIds).toEqual(['g1', 'g2']);
  });
});

it('summarises capacity and gaps', () => {
  const summary = seatingSummary([table('a', 8, ['g1']), table('b', 6)], [guest('g1'), guest('g2')]);
  expect(summary).toEqual({ tables: 2, capacity: 14, seated: 1, unseated: 1, spare: 13 });
});
