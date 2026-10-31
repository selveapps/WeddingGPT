import { zustandStorage } from '@/services/storage';
import { takeLabsCollection } from '@/services/storage/labsData';
import { useRunOfShowStore } from '@/store/runOfShowStore';

/**
 * One-time move of the Labs day-of timeline into the wedding day's run of
 * show, the first time the Run of show screen opens.
 */
export const LABS_TIMELINE_KEY = 'labs:timeline';

/** Resolves with how many items were imported. Never throws. */
export async function importLabTimeline({
  weddingId = null,
  store = useRunOfShowStore,
  storage = zustandStorage,
} = {}) {
  if (store.getState().labsImportedAt) return 0;
  const { items } = await takeLabsCollection(storage, LABS_TIMELINE_KEY);
  return store.getState().importLabs({ weddingId, items });
}
