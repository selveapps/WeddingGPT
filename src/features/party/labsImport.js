import { zustandStorage } from '@/services/storage';
import { takeLabsCollection } from '@/services/storage/labsData';
import { usePartyStore } from '@/store/partyStore';

/**
 * One-time move of the Labs wedding party into the real one, the first time
 * the Wedding party screen opens. Jobs keep their ticks.
 */
export const LABS_PARTY_KEY = 'labs:party';

/** Resolves with how many members were imported. Never throws. */
export async function importLabParty({
  weddingId = null,
  store = usePartyStore,
  storage = zustandStorage,
} = {}) {
  if (store.getState().labsImportedAt) return 0;
  const { items } = await takeLabsCollection(storage, LABS_PARTY_KEY);
  return store.getState().importLabs({ weddingId, members: items });
}
