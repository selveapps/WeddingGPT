import { useCallback } from 'react';

import { usePrivacySettings } from '../../privacy/hooks/usePrivacySettings';
import { buildShareableProfile } from '../lib/shareSummary';

export function useShareableProfile(values) {
  const { settings } = usePrivacySettings();
  return useCallback(() => buildShareableProfile(values, settings), [settings, values]);
}

export default useShareableProfile;
