import { useEffect, useState } from 'react';

import { useWeddingStore } from './weddingStore';
import { usePlanningStore } from './planningStore';
import { useBudgetStore } from './budgetStore';
import { useGuestStore } from './guestStore';
import { useAIStore } from './aiStore';
import { useNotificationStore } from './notificationStore';
import { useVendorStore } from './vendorStore';
import { useSyncStore } from './syncStore';
import { useRsvpStore } from './rsvpStore';
import { useWebsiteStore } from './websiteStore';
import { useSeatingStore } from './seatingStore';
import { useEventStore } from './eventStore';
import { useGiftStore } from './giftStore';
import { usePartyStore } from './partyStore';
import { useRunOfShowStore } from './runOfShowStore';
import { usePackingStore } from './packingStore';
import { workspaceStorage } from '../services/storage';
import { useSettingsStore } from './settingsStore';
// Feature stores added on main; each persists, so each switches with the
// workspace like the core stores.
import { useAfterPartyStore } from './afterPartyStore';
import { useAnalyticsStore } from './analyticsStore';
import { useAttireStore } from './attireStore';
import { useBackupStore } from './backupStore';
import { useBudgetAIStore } from './budgetAIStore';
import { useContentStudioStore } from './contentStudioStore';
import { useDocumentsStore } from './documentsStore';
import { useGuestExperienceStore } from './guestExperienceStore';
import { useHoneymoonProStore } from './honeymoonProStore';
import { useKidsCrewStore } from './kidsCrewStore';
import { useMenuStore } from './menuStore';
import { useMusicStore } from './musicStore';
import { usePhotoAlbumStore } from './photoAlbumStore';
import { useRegistryStore } from './registryStore';
import { useRehearsalStore } from './rehearsalStore';
import { useRsvpProStore } from './rsvpProStore';
import { useSeatingProStore } from './seatingProStore';
import { useSpeechesStore } from './speechesStore';
import { useTimelineProStore } from './timelineProStore';
import { useTravelStore } from './travelStore';
import { useVendorsProStore } from './vendorsProStore';
import { useWeatherStore } from './weatherStore';

export * from './weddingStore';
export * from './planningStore';
export * from './budgetStore';
export * from './guestStore';
export * from './aiStore';
export * from './notificationStore';
export * from './vendorStore';
export * from './syncStore';
export * from './rsvpStore';
export * from './websiteStore';
export * from './seatingStore';
export * from './eventStore';
export * from './giftStore';
export * from './partyStore';
export * from './runOfShowStore';
export * from './packingStore';
// Not in STORES below: sign-in is optional, so launch never waits on it.
export * from './authStore';
export * from './settingsStore';

const STORES = [
  useWeddingStore,
  usePlanningStore,
  useBudgetStore,
  useGuestStore,
  useAIStore,
  useNotificationStore,
  useVendorStore,
  useSyncStore,
  useRsvpStore,
  useWebsiteStore,
  useSeatingStore,
  useEventStore,
  useGiftStore,
  usePartyStore,
  useRunOfShowStore,
  usePackingStore,
  useSettingsStore,
  useAfterPartyStore,
  useAnalyticsStore,
  useAttireStore,
  useBackupStore,
  useBudgetAIStore,
  useContentStudioStore,
  useDocumentsStore,
  useGuestExperienceStore,
  useHoneymoonProStore,
  useKidsCrewStore,
  useMenuStore,
  useMusicStore,
  usePhotoAlbumStore,
  useRegistryStore,
  useRehearsalStore,
  useRsvpProStore,
  useSeatingProStore,
  useSpeechesStore,
  useTimelineProStore,
  useTravelStore,
  useVendorsProStore,
  useWeatherStore,
];

// Every persisted store switches with the active workspace (slice A3).
STORES.forEach((store) => workspaceStorage.register(store));

/**
 * Gate the app until every persisted store has rehydrated from disk.
 *
 * Without this, the first frame renders against empty stores and a returning
 * user sees "no tasks yet" for a beat before their real workspace appears -
 * which reads as data loss, and is the single worst first impression a
 * local-first app can make.
 *
 * zustand's persist middleware exposes both a synchronous `hasHydrated()` (true
 * when a store finished before this hook mounted) and an `onFinishHydration`
 * subscription. We need both: checking only the callback misses stores that
 * already finished, and checking only the flag misses ones still in flight.
 */
export function useStoreHydration() {
  const [hydrated, setHydrated] = useState(() => STORES.every((store) => store.persist.hasHydrated()));

  useEffect(() => {
    if (hydrated) return undefined;

    let cancelled = false;
    const pending = new Set(STORES.filter((store) => !store.persist.hasHydrated()));

    const settle = (store) => {
      pending.delete(store);
      if (!cancelled && pending.size === 0) setHydrated(true);
    };

    // A store can finish between the initial check and this subscription, so
    // re-check each one after subscribing rather than trusting the snapshot.
    const unsubscribers = [...pending].map((store) => store.persist.onFinishHydration(() => settle(store)));

    for (const store of [...pending]) {
      if (store.persist.hasHydrated()) settle(store);
    }

    if (pending.size === 0) setHydrated(true);

    return () => {
      cancelled = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe?.());
    };
  }, [hydrated]);

  return hydrated;
}

/**
 * Re-read every persisted store from disk. Backs the launch screen's Retry: if
 * storage throws during hydration, zustand never reports the store as
 * hydrated, so without a retry the app would wait on the splash forever.
 */
export function rehydrateAllStores() {
  return Promise.allSettled(STORES.map((store) => store.persist.rehydrate()));
}

/** Wipe every store. Used by "delete account" and development resets. */
export function resetAllStores() {
  useWeddingStore.getState().reset();
  usePlanningStore.getState().reset();
  useBudgetStore.getState().reset();
  useGuestStore.getState().reset();
  useAIStore.getState().reset();
  useNotificationStore.getState().reset();
  useVendorStore.getState().reset();
  useSyncStore.getState().reset();
  useRsvpStore.getState().reset();
  useWebsiteStore.getState().reset();
  useSeatingStore.getState().reset();
  useEventStore.getState().reset();
  useGiftStore.getState().reset();
  usePartyStore.getState().reset();
  useRunOfShowStore.getState().reset();
  usePackingStore.getState().reset();
  useSettingsStore.getState().resetAll();
}
