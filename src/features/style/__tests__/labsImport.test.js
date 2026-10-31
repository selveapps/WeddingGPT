import { useWeddingStore } from '@/store';
import { createWedding } from '@/models';

import { importLabStyle, LABS_STYLE_KEY } from '../labsImport';

const wedding = () => useWeddingStore.getState().wedding;

beforeEach(() => {
  useWeddingStore.setState({ wedding: createWedding({ ownerName: 'Priya', partnerName: 'Sam' }) });
});

describe('importLabStyle', () => {
  const storageWith = (value) => {
    const data = new Map([[LABS_STYLE_KEY, value]]);
    return {
      getItem: async (key) => data.get(key) ?? null,
      removeItem: async (key) => data.delete(key),
      data,
    };
  };
  const labs = (items, meta) =>
    JSON.stringify({
      state: {
        items: { byId: Object.fromEntries(items.map((i) => [i.id, i])), allIds: items.map((i) => i.id) },
        meta,
      },
    });

  it('moves answers, palette and moodboard into the wedding once', async () => {
    const storage = storageWith(
      labs(
        [
          { id: 'lmood_1', kind: 'note', text: 'Peonies, not roses' },
          { id: 'lmood_2', kind: 'link', text: 'https://pinterest.com/us' },
        ],
        { answers: { setting: 'barn' }, paletteKey: 'marigold' }
      )
    );
    expect(await importLabStyle({ storage })).toBe(2);
    expect(wedding()).toMatchObject({ styleQuizAnswers: { setting: 'barn' }, paletteKey: 'marigold' });
    expect(wedding().profileVisionIdeas.map((i) => i.title)).toEqual([
      'Peonies, not roses',
      'Inspiration link',
    ]);
    expect(storage.data.has(LABS_STYLE_KEY)).toBe(false);
  });

  it('keeps what the wedding already has, and waits for a wedding', async () => {
    useWeddingStore
      .getState()
      .updateWedding({ paletteKey: 'sea_glass', styleQuizAnswers: { setting: 'beach' } });
    await importLabStyle({
      storage: storageWith(labs([], { answers: { setting: 'barn' }, paletteKey: 'marigold' })),
    });
    expect(wedding()).toMatchObject({ paletteKey: 'sea_glass', styleQuizAnswers: { setting: 'beach' } });

    useWeddingStore.setState({ wedding: null });
    const waiting = storageWith(labs([{ id: 'x', kind: 'note', text: 'Later' }], {}));
    expect(await importLabStyle({ storage: waiting })).toBe(0);
    expect(waiting.data.has(LABS_STYLE_KEY)).toBe(true);
  });
});
