import { useMemo } from 'react';
import { useProfileCollection } from '../../hooks/useProfileCollection';
import { sortItinerary } from '../lib/honeymoonHelpers';

export const HONEYMOON_FIELD = 'profileHoneymoonItinerary';

export function useHoneymoonPlanner() {
  const collection = useProfileCollection(HONEYMOON_FIELD);
  const records = useMemo(() => sortItinerary(collection.records), [collection.records]);
  return { ...collection, records };
}
