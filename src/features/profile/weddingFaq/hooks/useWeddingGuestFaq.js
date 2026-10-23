import { useMemo } from 'react';
import { useProfileCollection } from '../../hooks/useProfileCollection';
import { sortFaq } from '../lib/weddingFaqHelpers';

export const WEDDING_FAQ_FIELD = 'profileWeddingGuestFaq';

export function useWeddingGuestFaq() {
  const collection = useProfileCollection(WEDDING_FAQ_FIELD);
  const records = useMemo(() => sortFaq(collection.records), [collection.records]);
  return { ...collection, records };
}
