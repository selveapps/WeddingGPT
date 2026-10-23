import { zustandStorage } from '@/services/storage';
import { takeLabsCollection } from '@/services/storage/labsData';
import { useGiftStore } from '@/store/giftStore';

/**
 * One-time move of gifts logged in the Labs tracker into the real list, the
 * first time the Gifts screen opens.
 */
export const LABS_GIFTS_KEY = 'labs:gifts';

/** Resolves with how many gifts were imported. Never throws. */
export async function importLabGifts({
  weddingId = null,
  store = useGiftStore,
  storage = zustandStorage,
} = {}) {
  if (store.getState().labsImportedAt) return 0;
  const { items } = await takeLabsCollection(storage, LABS_GIFTS_KEY);
  return store.getState().importLabs({ weddingId, gifts: items });
}
