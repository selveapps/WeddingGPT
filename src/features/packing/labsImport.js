import { zustandStorage } from '@/services/storage';
import { takeLabsCollection } from '@/services/storage/labsData';
import { usePackingStore } from '@/store/packingStore';

/**
 * One-time move of the Labs packing lists into the real ones, the first time
 * the Packing screen opens. Ticks come across.
 */
export const LABS_PACKING_KEY = 'labs:packing';

/** Resolves with how many items were imported. Never throws. */
export async function importLabPacking({
  weddingId = null,
  store = usePackingStore,
  storage = zustandStorage,
} = {}) {
  if (store.getState().labsImportedAt) return 0;
  const { items } = await takeLabsCollection(storage, LABS_PACKING_KEY);
  return store.getState().importLabs({ weddingId, items });
}
