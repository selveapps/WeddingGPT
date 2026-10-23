import { useProfileCollection } from '../../hooks/useProfileCollection';
import { SEATING_FIELD } from '../lib/seatingHelpers';

export function useWeddingSeating() {
  return useProfileCollection(SEATING_FIELD);
}

export default useWeddingSeating;
