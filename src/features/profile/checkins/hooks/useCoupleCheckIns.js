import { useMemo } from 'react';

import { useProfileCollection } from '../../hooks/useProfileCollection';
import { CHECKIN_FIELD } from '../lib/checkinConstants';
import { sortCheckIns } from '../lib/checkinHelpers';

export function useCoupleCheckIns() {
  const collection = useProfileCollection(CHECKIN_FIELD);
  const checkIns = useMemo(() => sortCheckIns(collection.records), [collection.records]);
  return { ...collection, checkIns };
}

export default useCoupleCheckIns;
