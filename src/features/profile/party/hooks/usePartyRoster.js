import { useMemo } from 'react';

import { useProfileCollection } from '../../hooks/useProfileCollection';
import { PARTY_FIELD } from '../lib/partyConstants';
import { sortPartyMembers } from '../lib/partyHelpers';

export function usePartyRoster() {
  const collection = useProfileCollection(PARTY_FIELD);
  const members = useMemo(() => sortPartyMembers(collection.records), [collection.records]);
  return { ...collection, members };
}

export default usePartyRoster;
