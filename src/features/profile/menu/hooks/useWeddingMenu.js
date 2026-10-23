import { useProfileCollection } from '../../hooks/useProfileCollection';
import { MENU_FIELD } from '../lib/menuHelpers';

export function useWeddingMenu() {
  return useProfileCollection(MENU_FIELD);
}

export default useWeddingMenu;
