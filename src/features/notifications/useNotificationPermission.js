import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

import { useNotificationStore } from '@/store';
import { getPermissionStatus, requestPermission } from '@/services/notifications';
import { analytics, AnalyticsEvents } from '@/services/analytics';

/**
 * The OS notification permission, kept fresh.
 *
 * Re-checked whenever the app returns to the foreground, because the usual way
 * to fix a "denied" is a trip to system settings and back.
 *
 * `enable()` asks for permission if it has not been asked yet, opens system
 * settings if it was refused before, and switches reminders on. Resolves to
 * true when reminders are actually on.
 */
export function useNotificationPermission() {
  const [status, setStatus] = useState('undetermined');
  const setEnabled = useNotificationStore((state) => state.setEnabled);
  const dismissPrompt = useNotificationStore((state) => state.dismissPrompt);

  const refresh = useCallback(async () => setStatus(await getPermissionStatus()), []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const enable = useCallback(async () => {
    const before = await getPermissionStatus();
    const next = before === 'granted' ? before : await requestPermission();
    setStatus(next);

    // Refused on an earlier visit, so the OS will not ask again - settings is
    // the only way back. A "no" just now is respected as it is.
    if (next === 'denied' && before === 'denied') {
      Linking.openSettings().catch(() => {});
      return false;
    }

    const granted = next === 'granted';
    if (granted) setEnabled(true);
    dismissPrompt();
    analytics.track(AnalyticsEvents.NOTIFICATION_PREFERENCE_CHANGED, { type: 'all', enabled: granted });
    return granted;
  }, [setEnabled, dismissPrompt]);

  return {
    status,
    granted: status === 'granted',
    supported: status !== 'unsupported',
    enable,
    refresh,
  };
}

export default useNotificationPermission;
