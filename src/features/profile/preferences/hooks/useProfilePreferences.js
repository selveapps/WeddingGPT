import { useCallback, useMemo } from 'react';

import { useWeddingStore, selectWedding } from '@/store/weddingStore';
import { normaliseProfilePreferences } from '../lib/preferenceHelpers';
import { DEFAULT_PROFILE_PREFERENCES } from '../lib/preferenceConstants';

export function useProfilePreferences() {
  const wedding = useWeddingStore(selectWedding);
  const updateWedding = useWeddingStore((state) => state.updateWedding);
  const preferences = useMemo(
    () => normaliseProfilePreferences(wedding?.profilePreferences),
    [wedding?.profilePreferences]
  );

  const setPreference = useCallback(
    (key, value) => {
      if (!Object.prototype.hasOwnProperty.call(DEFAULT_PROFILE_PREFERENCES, key)) return false;
      const currentWedding = useWeddingStore.getState().wedding;
      if (!currentWedding) return false;
      const current = normaliseProfilePreferences(currentWedding.profilePreferences);
      updateWedding({ profilePreferences: { ...current, [key]: value } });
      return true;
    },
    [updateWedding]
  );

  return { preferences, setPreference, hasWorkspace: Boolean(wedding) };
}

export default useProfilePreferences;
