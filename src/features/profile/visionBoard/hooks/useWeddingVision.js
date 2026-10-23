import { useMemo } from 'react';

import { useProfileCollection } from '../../hooks/useProfileCollection';
import { VISION_FIELD } from '../lib/visionConstants';
import { sortVisionIdeas } from '../lib/visionHelpers';

export function useWeddingVision() {
  const collection = useProfileCollection(VISION_FIELD);
  const ideas = useMemo(() => sortVisionIdeas(collection.records), [collection.records]);
  const toggleSaved = (id, saved) => collection.updateRecord(id, { saved });
  return { ...collection, ideas, toggleSaved };
}

export default useWeddingVision;
