import { useMemo } from 'react';

import { useProfileCollection } from '../../hooks/useProfileCollection';
import { GOAL_FIELD } from '../lib/goalConstants';
import { sortGoals } from '../lib/goalHelpers';

export function useCoupleGoals() {
  const collection = useProfileCollection(GOAL_FIELD);
  const goals = useMemo(() => sortGoals(collection.records), [collection.records]);

  const setComplete = (id, completed) => collection.updateRecord(id, { completed });

  return { ...collection, goals, setComplete };
}

export default useCoupleGoals;
