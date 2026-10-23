import {
  useAIStore,
  useBudgetStore,
  useGuestStore,
  useWeddingStore,
  selectAllExpenses,
  selectAllBudgetCategories,
} from '@/store';
import { RsvpStatus, SuggestionStatus, SuggestionType, createGuest, createWedding } from '@/models';

const mockReply = jest.fn(async () => ({
  content: 'From the assistant',
  proposal: null,
  metadata: { provider: 'test' },
}));
jest.mock('@/services/ai', () => ({
  aiService: { reply: (...args) => mockReply(...args), mode: 'test' },
  toAIError: (error) => error,
  AI_ERROR_META: {},
}));

const ai = () => useAIStore.getState();
const suggestions = () => Object.values(ai().suggestions.byId);

/** Wait until the reply in this conversation has finished revealing. */
async function settle(conversationId) {
  for (let i = 0; i < 200; i += 1) {
    const messages = Object.values(ai().messages.byId).filter((m) => m.conversationId === conversationId);
    if (messages.length && messages.every((m) => m.status === 'complete' || m.status === 'failed'))
      return messages;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('reply never finished');
}

let smiths;
beforeEach(() => {
  jest.clearAllMocks();
  ai().reset?.();
  useAIStore.setState({
    conversations: { byId: {}, allIds: [] },
    messages: { byId: {}, allIds: [] },
    suggestions: { byId: {}, allIds: [] },
  });
  const wedding = createWedding({ ownerName: 'Priya' });
  useWeddingStore.setState({ wedding });
  useGuestStore.getState().reset();
  smiths = [
    useGuestStore
      .getState()
      .addGuest(createGuest({ weddingId: wedding.id, firstName: 'John', lastName: 'Smith' })),
    useGuestStore
      .getState()
      .addGuest(createGuest({ weddingId: wedding.id, firstName: 'Mary', lastName: 'Smith' })),
  ];
  useBudgetStore.getState().reset();
  useBudgetStore.getState().initialiseBudget({ weddingId: wedding.id, total: 30000_00, currency: 'USD' });
});

describe('requests understood on the phone', () => {
  it('turns an expense request into a proposal without asking the assistant', async () => {
    const id = ai().sendMessage({ text: 'Add a $2,000 florist expense' });
    const [, reply] = await settle(id);
    expect(mockReply).not.toHaveBeenCalled();
    expect(reply.metadata.provider).toBe('device');
    const [suggestion] = suggestions();
    expect(suggestion).toMatchObject({ type: SuggestionType.ADD_EXPENSE, status: SuggestionStatus.PROPOSED });
    expect(suggestion.payload.amount).toBe(2000_00);
    // Nothing is in the budget until it is confirmed.
    expect(selectAllExpenses(useBudgetStore.getState())).toEqual([]);
  });

  it('records the expense only on confirm, with the couple’s edits', async () => {
    const id = ai().sendMessage({ text: 'Spent $450 on the cake' });
    await settle(id);
    const [suggestion] = suggestions();
    const venue = selectAllBudgetCategories(useBudgetStore.getState())[0];
    const result = ai().confirmSuggestion(suggestion.id, {
      ...suggestion.payload,
      title: 'Wedding cake',
      budgetCategoryId: venue.id,
    });
    expect(result).toEqual({ ok: true, count: 1 });
    const [expense] = selectAllExpenses(useBudgetStore.getState());
    expect(expense).toMatchObject({
      title: 'Wedding cake',
      amount: 450_00,
      paidAmount: 450_00,
      budgetCategoryId: venue.id,
    });
    // Confirming twice does not record it twice.
    expect(ai().confirmSuggestion(suggestion.id).ok).toBe(false);
    expect(selectAllExpenses(useBudgetStore.getState())).toHaveLength(1);
  });

  it('refuses an expense edited down to nothing', async () => {
    const id = ai().sendMessage({ text: 'Add a $2,000 florist expense' });
    await settle(id);
    const [suggestion] = suggestions();
    expect(ai().confirmSuggestion(suggestion.id, { ...suggestion.payload, amount: 0 }).ok).toBe(false);
    expect(selectAllExpenses(useBudgetStore.getState())).toEqual([]);
  });

  it('updates the matched guests’ RSVPs on confirm, skipping anyone deleted since', async () => {
    const id = ai().sendMessage({ text: 'Mark the Smiths as attending' });
    await settle(id);
    const [suggestion] = suggestions();
    expect(suggestion.type).toBe(SuggestionType.UPDATE_GUEST);
    expect(suggestion.payload.guestIds).toEqual(smiths.map((g) => g.id));

    useGuestStore.getState().deleteGuest(smiths[1].id);
    expect(ai().confirmSuggestion(suggestion.id)).toEqual({ ok: true, count: 1 });
    expect(useGuestStore.getState().guests.byId[smiths[0].id].rsvpStatus).toBe(RsvpStatus.ATTENDING);
  });

  it('adds a reminder as a one-task checklist', async () => {
    const id = ai().sendMessage({ text: 'Remind me to call the DJ by March 3' });
    await settle(id);
    const [suggestion] = suggestions();
    expect(suggestion.type).toBe(SuggestionType.CREATE_TASKS);
    expect(suggestion.payload.tasks).toEqual([expect.objectContaining({ title: 'Call the DJ' })]);
  });
});

describe('everything else goes to the assistant', () => {
  it.each(['How much budget is left?', 'We need to pick a venue, any tips?', 'Tell me about save the dates'])(
    '"%s"',
    async (text) => {
      const id = ai().sendMessage({ text });
      const [, reply] = await settle(id);
      expect(mockReply).toHaveBeenCalledTimes(1);
      expect(reply.content).toBe('From the assistant');
      expect(suggestions()).toEqual([]);
    }
  );

  it('sends the assistant counts, never the guest list', async () => {
    const id = ai().sendMessage({ text: 'How are we doing?' });
    await settle(id);
    const sent = JSON.stringify(mockReply.mock.calls[0][0]);
    expect(sent).not.toContain('Smith');
  });

  it('answers an RSVP for nobody on the list only when it was meant as one', async () => {
    const vague = ai().sendMessage({ text: 'The weather is coming' });
    await settle(vague);
    expect(mockReply).toHaveBeenCalledTimes(1);

    const explicit = ai().sendMessage({ text: 'Mark the Joneses as attending' });
    const [, reply] = await settle(explicit);
    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(reply.content).toMatch(/No guest called/);
    expect(suggestions()).toEqual([]);
  });
});
