import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '../services/storage';
import { createNotificationPreferences, touchEntity } from '../models';

/**
 * Reminder preferences: the master switch, the per-type toggles from
 * `NOTIFICATION_TYPE_META`, whether the couple has dismissed the "turn on
 * reminders" card on Home, and which in-app feed items they have seen.
 *
 * The OS permission is *not* stored here - it can change in system settings at
 * any time, so the service asks the OS each time instead of trusting a copy.
 */

const initialState = {
  preferences: createNotificationPreferences(),
  /** True once the couple has answered the Home prompt either way. */
  promptDismissed: false,
  /** Ids of in-app feed items already seen. Capped - old ids age out. */
  readIds: [],
};

const MAX_READ_IDS = 300;

export const useNotificationStore = create()(
  persist(
    (set, get) => ({
      ...initialState,

      setEnabled(enabled) {
        set({ preferences: touchEntity(get().preferences, { enabled: Boolean(enabled) }) });
      },

      setTypeEnabled(type, enabled) {
        const { preferences } = get();
        set({
          preferences: touchEntity(preferences, {
            types: { ...preferences.types, [type]: Boolean(enabled) },
          }),
        });
      },

      dismissPrompt() {
        set({ promptDismissed: true });
      },

      markRead(ids = []) {
        const current = get().readIds;
        const fresh = ids.filter((id) => !current.includes(id));
        if (fresh.length === 0) return;
        set({ readIds: [...current, ...fresh].slice(-MAX_READ_IDS) });
      },

      reset() {
        set({ ...initialState, preferences: createNotificationPreferences() });
      },
    }),
    {
      name: 'notifications:store',
      storage: zustandStorage,
      version: 1,
      partialize: (state) => ({
        preferences: state.preferences,
        promptDismissed: state.promptDismissed,
        readIds: state.readIds,
      }),
    }
  )
);

export const selectNotificationPreferences = (state) => state.preferences;
export const selectNotificationPromptDismissed = (state) => state.promptDismissed;
export const selectReadIds = (state) => state.readIds;
