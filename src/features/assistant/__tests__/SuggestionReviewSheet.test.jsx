import React from 'react';

import { useAIStore, useBudgetStore, useGuestStore, useWeddingStore, selectAllExpenses } from '@/store';
import {
  ExpenseCommitment,
  PaymentStatus,
  RsvpStatus,
  SuggestionType,
  createGuest,
  createSuggestion,
  createWedding,
} from '@/models';
import { act, press, pressables, renderWithProviders, shownTexts } from '@/test/render';

import { SuggestionCard } from '../SuggestionCard';

const mockRouter = { push: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('@/services/ai', () => ({
  aiService: { reply: jest.fn() },
  toAIError: (e) => e,
  AI_ERROR_META: {},
}));

const field = (tree, label) =>
  tree.root.find((n) => n.props.label === label && typeof n.props.onChangeText === 'function');

function propose(type, payload, title = 'Proposal') {
  const suggestion = createSuggestion({ conversationId: 'c1', messageId: 'm1', type, title, payload });
  useAIStore.setState((state) => ({
    suggestions: {
      byId: { ...state.suggestions.byId, [suggestion.id]: suggestion },
      allIds: [suggestion.id],
    },
  }));
  return suggestion;
}

let guests;
beforeEach(() => {
  jest.clearAllMocks();
  useAIStore.setState({ suggestions: { byId: {}, allIds: [] } });
  const wedding = createWedding({ ownerName: 'Priya' });
  useWeddingStore.setState({ wedding });
  useBudgetStore.getState().reset();
  useBudgetStore.getState().initialiseBudget({ weddingId: wedding.id, total: 30000_00, currency: 'USD' });
  useGuestStore.getState().reset();
  guests = ['John', 'Mary'].map((firstName) =>
    useGuestStore.getState().addGuest(createGuest({ weddingId: wedding.id, firstName, lastName: 'Smith' }))
  );
});

describe('expense proposals', () => {
  const expense = {
    title: 'Florist',
    amount: 2000_00,
    paidAmount: 0,
    paymentStatus: PaymentStatus.UNPAID,
    commitment: ExpenseCommitment.ESTIMATED,
    budgetCategoryId: null,
    date: null,
    dueDate: null,
  };

  it('records the expense, as edited, only from the sheet', async () => {
    const suggestion = propose(SuggestionType.ADD_EXPENSE, expense, 'Add $2,000 "Florist"');
    const tree = await renderWithProviders(<SuggestionCard suggestionId={suggestion.id} />);
    expect(shownTexts(tree)).toContain(
      'Check the amount and category - nothing is recorded until you confirm'
    );
    expect(selectAllExpenses(useBudgetStore.getState())).toEqual([]);

    await press(tree, 'Review expense');
    await act(async () => field(tree, 'What is it?').props.onChangeText('Bridal bouquet'));
    await press(tree, 'Already paid');
    await press(tree, 'Record expense');

    const [recorded] = selectAllExpenses(useBudgetStore.getState());
    expect(recorded).toMatchObject({ title: 'Bridal bouquet', amount: 2000_00, paidAmount: 2000_00 });
    expect(shownTexts(tree)).toContain('Recorded $2,000 in your budget');
  });

  it('can be discarded without touching the budget', async () => {
    const suggestion = propose(SuggestionType.ADD_EXPENSE, expense);
    const tree = await renderWithProviders(<SuggestionCard suggestionId={suggestion.id} />);
    await press(tree, 'Review expense');
    await press(tree, 'Discard suggestion');
    expect(selectAllExpenses(useBudgetStore.getState())).toEqual([]);
    expect(shownTexts(tree)).toContain('Suggestion discarded');
  });
});

describe('RSVP proposals', () => {
  it('lets the couple leave someone out and change the answer', async () => {
    const suggestion = propose(SuggestionType.UPDATE_GUEST, {
      guestIds: guests.map((g) => g.id),
      rsvpStatus: RsvpStatus.ATTENDING,
    });
    const tree = await renderWithProviders(<SuggestionCard suggestionId={suggestion.id} />);
    await press(tree, 'Review RSVP');
    expect(pressables(tree, 'Update 2 guests')).toHaveLength(1);
    await press(tree, 'Leave out Mary Smith');
    await press(tree, 'Declined');
    await press(tree, 'Update 1 guest');

    const byId = useGuestStore.getState().guests.byId;
    expect(byId[guests[0].id].rsvpStatus).toBe(RsvpStatus.DECLINED);
    expect(byId[guests[1].id].rsvpStatus).not.toBe(RsvpStatus.DECLINED);
    expect(shownTexts(tree)).toContain('Updated 1 guest');
  });
});
