import { useMemo } from 'react';
import { useProfileCollection } from '../../hooks/useProfileCollection';
import { sortRegistry } from '../lib/registryHelpers';

export const REGISTRY_FIELD = 'profileGiftRegistry';

export function useGiftRegistry() {
  const collection = useProfileCollection(REGISTRY_FIELD);
  const records = useMemo(() => sortRegistry(collection.records), [collection.records]);
  return { ...collection, records };
}
