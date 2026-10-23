import { useRunOfShowStore, selectRunOfShow } from '@/store';
import { RUN_OF_SHOW_LIMITS, SAMPLE_DAY, itemsForDay, sortRunOfShow } from '@/models';
import { importLabTimeline, LABS_TIMELINE_KEY } from '@/features/runOfShow/labsImport';

const store = () => useRunOfShowStore.getState();
const day = (eventId = null) => sortRunOfShow(itemsForDay(selectRunOfShow(store()), eventId));

beforeEach(() => store().reset());

describe('runOfShowStore', () => {
  it('keeps each day separate', () => {
    store().addItem({ title: 'Ceremony', start: 960 });
    store().addItem({ title: 'Henna', start: 1080, eventId: 'event_mehndi' });
    expect(day().map((i) => i.title)).toEqual(['Ceremony']);
    expect(day('event_mehndi').map((i) => i.title)).toEqual(['Henna']);
  });

  it('cleans up what is typed and edited', () => {
    const item = store().addItem({ title: '  Dinner ', start: 1080.4, durationMin: -5 });
    expect(item).toMatchObject({ title: 'Dinner', start: 1080, durationMin: 0 });
    const edited = store().updateItem(item.id, { durationMin: 99999, location: ' Barn ' });
    expect(edited).toMatchObject({ durationMin: RUN_OF_SHOW_LIMITS.maxDurationMin, location: 'Barn' });
    expect(store().updateItem('missing', {})).toBeNull();
  });

  it('loads the sample into an empty day only', () => {
    expect(store().loadSample({ weddingId: 'w1', eventId: 'event_1' })).toBe(SAMPLE_DAY.length);
    expect(store().loadSample({ weddingId: 'w1', eventId: 'event_1' })).toBe(0);
    expect(day('event_1')).toHaveLength(SAMPLE_DAY.length);
    expect(day()).toEqual([]);
  });

  it('shifts an item and what follows on its own day only', () => {
    const photos = store().addItem({ title: 'Photos', start: 840 });
    const dinner = store().addItem({ title: 'Dinner', start: 1080 });
    const dance = store().addItem({ title: 'Dance', start: 1200 });
    const other = store().addItem({ title: 'Henna', start: 1100, eventId: 'event_1' });

    expect(store().shift(dinner.id, 20)).toBe(2);
    const byId = new Map(selectRunOfShow(store()).map((i) => [i.id, i]));
    expect(byId.get(photos.id).start).toBe(840);
    expect(byId.get(dinner.id).start).toBe(1100);
    expect(byId.get(dance.id).start).toBe(1220);
    expect(byId.get(other.id).start).toBe(1100);
    expect(store().shift('missing', 15)).toBe(0);
  });

  it('clears one day and leaves the others', () => {
    store().addItem({ title: 'Ceremony', start: 960 });
    store().addItem({ title: 'Henna', start: 1080, eventId: 'event_1' });
    expect(store().clearDay('event_1')).toBe(1);
    expect(selectRunOfShow(store()).map((i) => i.title)).toEqual(['Ceremony']);
  });

  it(`holds up to ${RUN_OF_SHOW_LIMITS.perDay} items a day`, () => {
    for (let i = 0; i < RUN_OF_SHOW_LIMITS.perDay; i += 1) store().addItem({ title: `Item ${i}`, start: i });
    expect(store().addItem({ title: 'One more', start: 1 })).toBeNull();
    expect(store().addItem({ title: 'Another day', start: 1, eventId: 'event_1' })).toBeTruthy();
  });
});

describe('importLabTimeline', () => {
  it('brings the Labs timeline over once as the wedding day', async () => {
    const items = [
      { id: 'levent_1', title: 'Ceremony', start: 960, durationMin: 30, owner: 'Officiant' },
      { id: 'levent_2', title: 'No time', start: 'soon' },
      { id: 'levent_3', title: '', start: 100 },
    ];
    const data = new Map([
      [
        LABS_TIMELINE_KEY,
        JSON.stringify({
          state: {
            items: { byId: Object.fromEntries(items.map((i) => [i.id, i])), allIds: items.map((i) => i.id) },
          },
        }),
      ],
    ]);
    const storage = {
      getItem: async (key) => data.get(key) ?? null,
      removeItem: async (key) => data.delete(key),
    };

    expect(await importLabTimeline({ weddingId: 'w1', storage })).toBe(1);
    expect(day()).toEqual([
      expect.objectContaining({ title: 'Ceremony', start: 960, owner: 'Officiant', weddingId: 'w1' }),
    ]);
    expect(data.has(LABS_TIMELINE_KEY)).toBe(false);
    expect(await importLabTimeline({ storage })).toBe(0);
  });
});
