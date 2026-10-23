import { useMemo } from 'react';

import { useProfileCollection } from '../../hooks/useProfileCollection';
import { KEEPSAKE_FIELD } from '../lib/keepsakeConstants';
import { sortKeepsakes } from '../lib/keepsakeHelpers';

export function useKeepsakes() {
  const collection = useProfileCollection(KEEPSAKE_FIELD);
  const keepsakes = useMemo(() => sortKeepsakes(collection.records), [collection.records]);
  return { ...collection, keepsakes };
}

export default useKeepsakes;
