import { useGiftStore, selectGifts, selectGiftById } from '@/store';
import { GIFT_LIMITS, ThankYouStatus } from '@/models';
import { todayISO } from '@/lib/date';
import { importLabGifts, LABS_GIFTS_KEY } from '@/features/gifts/labsImport';

const store = () => useGiftStore.getState();
const gift = (id) => selectGiftById(id)(store());

beforeEach(() => store().reset());

describe('giftStore', () => {
  it('logs, edits and deletes gifts', () => {
    const made = store().addGift({ weddingId: 'w1', fromName: 'Maria', description: 'mixer' });
    expect(selectGifts(store()).map((g) => g.fromName)).toEqual(['Maria']);
    store().updateGift(made.id, { description: 'stand mixer' });
    expect(gift(made.id).description).toBe('stand mixer');
    expect(store().updateGift('missing', {})).toBeNull();
    store().removeGift(made.id);
    expect(selectGifts(store())).toEqual([]);
  });

  it('moves the thank-you along and records when it was sent', () => {
    const made = store().addGift({ fromName: 'Maria' });
    expect(store().cycleThankYou(made.id).thankYouStatus).toBe(ThankYouStatus.DRAFTED);
    const sent = store().cycleThankYou(made.id);
    expect(sent).toMatchObject({ thankYouStatus: ThankYouStatus.SENT, thankedOn: todayISO() });
    // Editing a thanked gift keeps the date it was thanked.
    expect(store().updateGift(made.id, { description: 'vase' }).thankedOn).toBe(todayISO());
    expect(store().cycleThankYou(made.id)).toMatchObject({
      thankYouStatus: ThankYouStatus.TODO,
      thankedOn: null,
    });
    expect(store().cycleThankYou('missing')).toBeNull();
  });

  it(`holds up to ${GIFT_LIMITS.perWedding} gifts`, () => {
    useGiftStore.setState({
      gifts: { byId: {}, allIds: Array.from({ length: GIFT_LIMITS.perWedding }, (_, i) => `g${i}`) },
    });
    expect(store().addGift({ fromName: 'One more' })).toBeNull();
  });
});

describe('importLabGifts', () => {
  const memory = (value) => {
    const data = new Map(value === undefined ? [] : [[LABS_GIFTS_KEY, value]]);
    return {
      getItem: jest.fn(async (key) => data.get(key) ?? null),
      removeItem: jest.fn(async (key) => data.delete(key)),
      data,
    };
  };
  const labs = (items) =>
    JSON.stringify({
      state: {
        items: { byId: Object.fromEntries(items.map((i) => [i.id, i])), allIds: items.map((i) => i.id) },
      },
    });

  it('brings Labs gifts over once and removes the Labs copy', async () => {
    const storage = memory(
      labs([
        {
          id: 'lgift_1',
          fromName: 'Maria',
          kind: 'money',
          value: 5000,
          receivedOn: '2027-06-19',
          thankYouStatus: 'sent',
        },
        { id: 'lgift_2', fromName: 'Sam', thankYouStatus: 'weird' },
        { id: 'lgift_3', fromName: '  ' },
      ])
    );
    expect(await importLabGifts({ weddingId: 'w1', storage })).toBe(2);
    const gifts = selectGifts(store());
    expect(gifts.map((g) => [g.fromName, g.thankYouStatus, g.weddingId])).toEqual([
      ['Maria', 'sent', 'w1'],
      ['Sam', 'todo', 'w1'],
    ]);
    expect(gifts[0].thankedOn).toBe(todayISO());
    expect(gifts[0].id).toMatch(/^gift_/);
    expect(storage.data.has(LABS_GIFTS_KEY)).toBe(false);

    expect(
      await importLabGifts({ weddingId: 'w1', storage: memory(labs([{ id: 'x', fromName: 'Again' }])) })
    ).toBe(0);
  });

  it('marks the import done even when Labs had nothing or was damaged', async () => {
    expect(await importLabGifts({ storage: memory('{not json') })).toBe(0);
    expect(store().labsImportedAt).toBeTruthy();
  });
});
