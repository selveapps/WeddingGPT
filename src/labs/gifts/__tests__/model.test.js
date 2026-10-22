import {
  GiftKind,
  ThankYouStatus,
  draftThankYou,
  matchGuest,
  nextThankYouStatus,
  sortGifts,
  summariseGifts,
  thankYouDue,
} from '../model';

const WEDDING = '2027-06-19';

const gift = (id, fields = {}) => ({
  id,
  fromName: 'Maria',
  kind: GiftKind.ITEM,
  receivedOn: '2027-06-19',
  thankYouStatus: ThankYouStatus.TODO,
  ...fields,
});

describe('thankYouDue', () => {
  it('gives early gifts two weeks', () => {
    expect(thankYouDue(gift('a', { receivedOn: '2027-05-01' }), { weddingDate: WEDDING }).dueDate).toBe('2027-05-15');
  });

  it('gives wedding-day gifts three months', () => {
    expect(thankYouDue(gift('a'), { weddingDate: WEDDING }).dueDate).toBe('2027-09-17');
  });

  it('never gives a late gift less than two weeks', () => {
    expect(thankYouDue(gift('a', { receivedOn: '2027-09-10' }), { weddingDate: WEDDING }).dueDate).toBe('2027-09-24');
  });

  it('is overdue only while unsent', () => {
    const from = new Date(2027, 11, 1);
    expect(thankYouDue(gift('a'), { weddingDate: WEDDING, from }).overdue).toBe(true);
    expect(
      thankYouDue(gift('a', { thankYouStatus: ThankYouStatus.SENT }), { weddingDate: WEDDING, from }).overdue
    ).toBe(false);
  });
});

it('cycles through statuses', () => {
  expect(nextThankYouStatus(ThankYouStatus.TODO)).toBe(ThankYouStatus.DRAFTED);
  expect(nextThankYouStatus(ThankYouStatus.SENT)).toBe(ThankYouStatus.TODO);
});

it('summarises progress and money gifts', () => {
  const summary = summariseGifts([
    gift('a', { kind: GiftKind.MONEY, value: 10000 }),
    gift('b', { thankYouStatus: ThankYouStatus.SENT }),
  ]);
  expect(summary).toEqual({ total: 2, money: 10000, toWrite: 1, sent: 1, progress: 0.5 });
});

it('sorts unsent and soonest-due first', () => {
  const sorted = sortGifts(
    [
      gift('sent', { thankYouStatus: ThankYouStatus.SENT, receivedOn: '2027-01-01' }),
      gift('later'),
      gift('early', { receivedOn: '2027-05-01' }),
    ],
    { weddingDate: WEDDING }
  );
  expect(sorted.map((g) => g.id)).toEqual(['early', 'later', 'sent']);
});

it('matches guests by full or first name', () => {
  const guests = [{ id: 'g1', firstName: 'Maria', lastName: 'Lopez' }];
  expect(matchGuest('maria lopez', guests)?.id).toBe('g1');
  expect(matchGuest('Maria', guests)?.id).toBe('g1');
  expect(matchGuest('Mark', guests)).toBeNull();
});

it('drafts a note that names the gift', () => {
  const note = draftThankYou({ gift: gift('a', { description: 'stand mixer' }), coupleName: 'Sam and Alex' });
  expect(note).toContain('Dear Maria,');
  expect(note).toContain('the stand mixer');
  expect(note.endsWith('Sam and Alex')).toBe(true);
  expect(draftThankYou({ gift: gift('b', { kind: GiftKind.MONEY, description: 'our honeymoon' }) })).toContain(
    'towards our honeymoon'
  );
});
