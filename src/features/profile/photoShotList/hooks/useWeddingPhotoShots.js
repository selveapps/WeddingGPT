import { useProfileCollection } from '../../hooks/useProfileCollection';
import { PHOTO_SHOTS_FIELD } from '../lib/photoShotListHelpers';

export function useWeddingPhotoShots() {
  return useProfileCollection(PHOTO_SHOTS_FIELD);
}

export default useWeddingPhotoShots;
