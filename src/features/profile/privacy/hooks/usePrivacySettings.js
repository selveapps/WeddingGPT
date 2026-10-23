import { useCallback, useMemo } from 'react';

import { useWeddingStore, selectWedding } from '@/store/weddingStore';
import { DEFAULT_PRIVACY_SETTINGS } from '../lib/privacyConstants';
import { normalisePrivacySettings } from '../lib/privacyHelpers';

export function usePrivacySettings() {
  const wedding = useWeddingStore(selectWedding);
  const updateWedding = useWeddingStore((state) => state.updateWedding);
  const settings = useMemo(
    () => normalisePrivacySettings(wedding?.profilePrivacy),
    [wedding?.profilePrivacy]
  );

  const setSetting = useCallback(
    (key, value) => {
      if (
        !Object.prototype.hasOwnProperty.call(DEFAULT_PRIVACY_SETTINGS, key) ||
        typeof value !== 'boolean'
      ) {
        return false;
      }
      const currentWedding = useWeddingStore.getState().wedding;
      if (!currentWedding) return false;
      const current = normalisePrivacySettings(currentWedding.profilePrivacy);
      updateWedding({ profilePrivacy: { ...current, [key]: value } });
      return true;
    },
    [updateWedding]
  );

  return { settings, setSetting, hasWorkspace: Boolean(wedding) };
}

export default usePrivacySettings;
