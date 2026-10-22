import { RsvpStatus, TaskStatus, PaymentStatus, ExpenseCommitment } from '@/models';

import { buildSnapshot } from '../../sync/model';
import {
  budgetCsv,
  checklistText,
  checksum,
  guestsCsv,
  planSummary,
  verifyBackup,
  wrapBackup,
} from '../model';

const col = (...items) => ({ byId: Object.fromEntries(items.map((i) => [i.id, i])), allIds: items.map((i) => i.id) });

it('exports guests with household names and readable statuses', () => {
  const csv = guestsCsv(
    [{ id: 'g1', firstName: 'Ana', lastName: 'Ruiz', householdId: 'h1', rsvpStatus: RsvpStatus.ATTENDING, tags: ['family', 'vip'] }],
    [{ id: 'h1', name: 'Ruiz family' }]
  );
  const [, row] = csv.split('\n');
  expect(row).toBe('Ana,Ruiz,Ruiz family,,,Attending,,,,,,No,family; vip,');
});

it('exports the budget in dollars with what is owed', () => {
  const csv = budgetCsv(
    [{ title: 'Florist', budgetCategoryId: 'c1', amount: 200000, paidAmount: 50000, paymentStatus: PaymentStatus.DEPOSIT_PAID, dueDate: '2027-06-05' }],
    [{ id: 'c1', name: 'Flowers and decor' }]
  );
  expect(csv.split('\n')[1]).toBe('Florist,Flowers and decor,,2000,500,1500,Deposit paid,2027-06-05');
});

it('writes the checklist with open tasks soonest first', () => {
  const text = checklistText([
    { title: 'Book band', status: TaskStatus.TODO, dueDate: '2027-05-01' },
    { title: 'Book venue', status: TaskStatus.DONE },
    { title: 'Send invites', status: TaskStatus.TODO, dueDate: '2027-03-01' },
  ]);
  expect(text.split('\n')).toEqual([
    'Wedding checklist - 1 of 3 done',
    '',
    'To do:',
    '[ ] Send invites (Mar 1, 2027)',
    '[ ] Book band (May 1, 2027)',
    '',
    'Done:',
    '[x] Book venue',
  ]);
});

it('summarises the whole plan', () => {
  const text = planSummary({
    wedding: { ownerName: 'Sam', partnerName: 'Alex', date: '2027-06-19', city: 'Austin' },
    tasks: [{ status: TaskStatus.DONE }, { status: TaskStatus.TODO }],
    budget: { total: 3000000 },
    expenses: [{ amount: 500000, paidAmount: 500000, commitment: ExpenseCommitment.COMMITTED }],
    guests: [{ rsvpStatus: RsvpStatus.ATTENDING }, { rsvpStatus: RsvpStatus.PENDING }],
    from: new Date(2027, 5, 9),
  });
  expect(text).toContain('Sam and Alex - plan summary');
  expect(text).toContain('Date: June 19, 2027 (10 days to go)');
  expect(text).toContain('Checklist: 50% done (2 tasks)');
  expect(text).toContain('$5,000 spent');
  expect(text).toContain('Guests: 2 invited, 1 coming, 0 declined, 1 awaiting');
});

describe('backup', () => {
  const snapshot = buildSnapshot({
    collections: { guests: col({ id: 'g1', updatedAt: 'x' }) },
    singletons: { wedding: { id: 'w', ownerName: 'Sam' } },
  });

  it('round-trips and verifies the checksum', () => {
    const result = verifyBackup(wrapBackup(snapshot));
    expect(result).toMatchObject({ ok: true, verified: true, weddingName: 'Sam' });
    expect(result.counts.find((c) => c.key === 'guests').count).toBe(1);
  });

  it('accepts a plain snapshot without a checksum', () => {
    expect(verifyBackup(JSON.stringify(snapshot))).toMatchObject({ ok: true, verified: false });
  });

  it('rejects a backup edited after it was made', () => {
    const tampered = JSON.parse(wrapBackup(snapshot));
    tampered.collections.guests.byId.g1.firstName = 'Changed';
    expect(verifyBackup(JSON.stringify(tampered)).ok).toBe(false);
  });

  it('rejects text that is not a backup', () => {
    expect(verifyBackup('hello').ok).toBe(false);
  });

  it('has a stable checksum', () => {
    expect(checksum('abc')).toBe(checksum('abc'));
    expect(checksum('abc')).not.toBe(checksum('abd'));
    expect(checksum('')).toHaveLength(8);
  });
});
