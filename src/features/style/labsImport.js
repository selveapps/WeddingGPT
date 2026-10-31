import { zustandStorage } from '@/services/storage';
import { takeLabsCollection } from '@/services/storage/labsData';
import { useWeddingStore } from '@/store/weddingStore';
import { moodItemsToVisionIdeas } from '@/models';
import { createId } from '@/lib/id';
import { VISION_FIELD } from '@/features/profile/visionBoard/lib/visionConstants';

/**
 * One-time move of the Labs style studio into the wedding: quiz answers and
 * the palette (unless the wedding already has its own), and moodboard notes
 * and links as vision board ideas. Waits until there is a wedding to move
 * them into, so nothing is lost by opening the screen early.
 */
export const LABS_STYLE_KEY = 'labs:style';

/** Resolves with how many vision ideas were added. Never throws. */
export async function importLabStyle({ store = useWeddingStore, storage = zustandStorage } = {}) {
  const wedding = store.getState().wedding;
  if (!wedding) return 0;
  const { items, meta } = await takeLabsCollection(storage, LABS_STYLE_KEY);

  const patch = {};
  const answers = meta.answers && typeof meta.answers === 'object' ? meta.answers : null;
  if (answers && Object.keys(answers).length && !wedding.styleQuizAnswers) patch.styleQuizAnswers = answers;
  if (typeof meta.paletteKey === 'string' && !wedding.paletteKey) patch.paletteKey = meta.paletteKey;

  const now = new Date().toISOString();
  const ideas = moodItemsToVisionIdeas(items).map((idea) => ({
    id: createId(VISION_FIELD),
    createdAt: now,
    updatedAt: now,
    saved: false,
    ...idea,
  }));
  if (ideas.length) {
    const current = Array.isArray(wedding[VISION_FIELD]) ? wedding[VISION_FIELD] : [];
    patch[VISION_FIELD] = [...current, ...ideas];
  }
  if (Object.keys(patch).length) store.getState().updateWedding(patch);
  return ideas.length;
}
