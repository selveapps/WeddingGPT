import { useMemo } from 'react';
import { useProfileCollection } from '../../hooks/useProfileCollection';
import { sortAttire } from '../lib/attireHelpers';

export const ATTIRE_FIELD = 'profileAttireFittings';

export function useAttireTracker() {
  const collection = useProfileCollection(ATTIRE_FIELD);
  const records = useMemo(() => sortAttire(collection.records), [collection.records]);
  return { ...collection, records };
}
