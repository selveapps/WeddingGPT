import { zustandStorage } from '@/services/storage';
import { takeLabsCollection } from '@/services/storage/labsData';
import { useSeatingStore } from '@/store/seatingStore';

/**
 * One-time move of a seating plan made in the Labs seating chart into the
 * real one, the first time the Seating screen opens. Tables keep their names,
 * sizes and guests; keep-apart pairs come too.
 */
export const LABS_SEATING_KEY = 'labs:seating';

/** Resolves with how many tables were imported. Never throws. */
export async function importLabSeating({
  weddingId = null,
  store = useSeatingStore,
  storage = zustandStorage,
} = {}) {
  if (store.getState().labsImportedAt) return 0;
  const { items, meta } = await takeLabsCollection(storage, LABS_SEATING_KEY);
  const avoidPairs = Array.isArray(meta.avoidPairs)
    ? meta.avoidPairs.filter((pair) => Array.isArray(pair) && pair.length === 2)
    : [];
  return store.getState().importLabs({ weddingId, tables: items, avoidPairs });
}
