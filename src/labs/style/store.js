import { createCollectionStore } from '../shared/createCollectionStore';

/**
 * Moodboard items live in the collection; quiz answers and the chosen
 * palette live in `meta`.
 */
export const useLabStyleStore = createCollectionStore({
  key: 'style',
  prefix: 'lmood',
  extend: (set, get) => ({
    answer(questionId, optionKey) {
      const answers = get().meta.answers ?? {};
      get().setMeta({ answers: { ...answers, [questionId]: optionKey } });
    },

    choosePalette(paletteKey) {
      get().setMeta({ paletteKey });
    },

    clearQuiz() {
      get().setMeta({ answers: {} });
    },
  }),
});
