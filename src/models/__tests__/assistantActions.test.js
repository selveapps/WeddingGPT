import { RsvpStatus, PaymentStatus, ExpenseCommitment } from '@/models';

import {
  ActionKind,
  EXAMPLES,
  actionReply,
  deviceActionReply,
  matchGuests,
  parseCommand,
} from '../assistantActions';
import { SuggestionType } from '../enums';

const FROM = new Date(2027, 0, 10);

const guests = [
  { id: 'g1', firstName: 'John', lastName: 'Smith' },
  { id: 'g2', firstName: 'Mary', lastName: 'Smith' },
  { id: 'g3', firstName: 'Jane', lastName: 'Doe' },
  { id: 'g4', firstName: 'Jane', lastName: 'Park' },
];

const categories = [
  { id: 'c-decor', key: 'decor', name: 'Flowers and decor' },
  { id: 'c-cat', key: 'catering', name: 'Catering and bar' },
  { id: 'c-music', key: 'music', name: 'Music and entertainment' },
];

const parse = (text) => parseCommand(text, { guests, categories, from: FROM });

describe('matchGuests', () => {
  it('matches families, full names and unique first names', () => {
    expect(matchGuests('the Smiths', guests).map((g) => g.id)).toEqual(['g1', 'g2']);
    expect(matchGuests('Smith family', guests).map((g) => g.id)).toEqual(['g1', 'g2']);
    expect(matchGuests('jane doe', guests).map((g) => g.id)).toEqual(['g3']);
    expect(matchGuests('Mary', guests).map((g) => g.id)).toEqual(['g2']);
  });

  it('returns every match for an ambiguous first name', () => {
    expect(matchGuests('Jane', guests)).toHaveLength(2);
  });
});

describe('parseCommand', () => {
  it('reads RSVP updates in several phrasings', () => {
    expect(parse('Mark the Smiths as attending')).toMatchObject({
      kind: ActionKind.SET_RSVP,
      payload: { guestIds: ['g1', 'g2'], rsvpStatus: RsvpStatus.ATTENDING },
      ready: true,
    });
    expect(parse('Jane Doe declined').payload.rsvpStatus).toBe(RsvpStatus.DECLINED);
    expect(parse('The Smiths are not coming').payload.rsvpStatus).toBe(RsvpStatus.DECLINED);
    expect(parse('Mark Bob as maybe')).toMatchObject({ ready: false });
  });

  it('reads tasks with and without due dates', () => {
    expect(parse('Remind me to call the DJ by March 3')).toMatchObject({
      kind: ActionKind.ADD_TASK,
      payload: { title: 'Call the DJ', dueDate: '2027-03-03' },
    });
    expect(parse('add task book the hair trial next week').payload).toEqual({
      title: 'Book the hair trial',
      dueDate: '2027-01-17',
    });
    expect(parse('todo: order favors').payload.dueDate).toBeNull();
  });

  it('reads planned expenses with a category', () => {
    expect(parse('Add a $2,000 florist expense')).toMatchObject({
      kind: ActionKind.ADD_EXPENSE,
      payload: {
        title: 'Florist',
        amount: 200000,
        paidAmount: 0,
        commitment: ExpenseCommitment.ESTIMATED,
        budgetCategoryId: 'c-decor',
      },
    });
  });

  it('records spending as paid', () => {
    expect(parse('Spent 450 on the cake').payload).toMatchObject({
      title: 'Cake',
      amount: 45000,
      paidAmount: 45000,
      paymentStatus: PaymentStatus.PAID,
      budgetCategoryId: 'c-cat',
    });
  });

  it('does not read a date as the amount', () => {
    expect(parse('Add DJ deposit $500 due 3/14/2027').payload).toMatchObject({
      amount: 50000,
      dueDate: '2027-03-14',
      budgetCategoryId: 'c-music',
    });
  });

  it('warns on an unmatched category and gives up on nonsense', () => {
    expect(parse('Add $90 for umbrellas').warnings[0]).toMatch(/uncategorised/);
    expect(parse('what a lovely day').kind).toBe(ActionKind.UNKNOWN);
    expect(parse('   ')).toBeNull();
  });

  it('understands every example it suggests', () => {
    for (const example of EXAMPLES) expect(parse(example).kind).not.toBe(ActionKind.UNKNOWN);
  });
});

describe('deviceActionReply', () => {
  const reply = (text) => deviceActionReply(text, { guests, categories, from: FROM });

  it('proposes expenses, RSVPs and reminders in the chat suggestion shape', () => {
    expect(reply('Add a $2,000 florist expense').proposal).toMatchObject({
      type: SuggestionType.ADD_EXPENSE,
      payload: { amount: 200000, budgetCategoryId: 'c-decor' },
    });
    expect(reply('Mark the Smiths as attending').proposal).toMatchObject({
      type: SuggestionType.UPDATE_GUEST,
      payload: { guestIds: ['g1', 'g2'], rsvpStatus: RsvpStatus.ATTENDING },
    });
    expect(reply('Remind me to call the DJ by March 3').proposal).toMatchObject({
      type: SuggestionType.CREATE_TASKS,
      payload: { tasks: [{ title: 'Call the DJ', dueDate: '2027-03-03' }] },
    });
  });

  it('leaves questions and chat to the assistant', () => {
    expect(reply('How much have we spent on the cake? $450')).toBeNull();
    expect(reply('We need to pick a venue, any ideas?')).toBeNull();
    expect(reply('Tell me about save the dates')).toBeNull();
    expect(reply('')).toBeNull();
  });

  it('answers an unknown guest only when the RSVP was explicit', () => {
    expect(reply('The weather is coming')).toBeNull();
    const explicit = reply('Mark the Joneses as attending');
    expect(explicit.proposal).toBeNull();
    expect(explicit.content).toMatch(/No guest called "the Joneses"/);
  });

  it('turns nothing that was not understood into a proposal', () => {
    expect(actionReply(null)).toBeNull();
    expect(actionReply({ kind: ActionKind.UNKNOWN })).toBeNull();
  });
});
