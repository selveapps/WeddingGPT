import { useMemo } from 'react';

import { useProfileCollection } from '../../hooks/useProfileCollection';
import { MILESTONE_FIELD } from '../lib/milestoneConstants';
import { sortMilestones } from '../lib/milestoneHelpers';

export function useMilestones() {
  const collection = useProfileCollection(MILESTONE_FIELD);
  const milestones = useMemo(() => sortMilestones(collection.records), [collection.records]);

  const toggleComplete = (id, completed) => collection.updateRecord(id, { completed });

  return { ...collection, milestones, toggleComplete };
}

export default useMilestones;
