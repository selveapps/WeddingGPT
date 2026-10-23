import { useProfileCollection } from '../../hooks/useProfileCollection';
import { MUSIC_FIELD } from '../lib/musicHelpers';

export function useWeddingMusic() {
  return useProfileCollection(MUSIC_FIELD);
}

export default useWeddingMusic;
