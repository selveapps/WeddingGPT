import { useMemo } from 'react';
import { useProfileCollection } from '../../hooks/useProfileCollection';
import { sortTransport } from '../lib/transportHelpers';

export const TRANSPORT_FIELD = 'profileGuestTransport';

export function useGuestTransport() {
  const collection = useProfileCollection(TRANSPORT_FIELD);
  const records = useMemo(() => sortTransport(collection.records), [collection.records]);
  return { ...collection, records };
}
