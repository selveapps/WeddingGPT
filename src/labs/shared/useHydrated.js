import { useSyncExternalStore } from 'react';

/**
 * True once a persisted Labs store has loaded from disk. Labs stores are not
 * in the app's launch gate (they must never slow launch), so anything that
 * seeds defaults waits on this - seeding first would race the saved data.
 */
export function useHydrated(store) {
  return useSyncExternalStore(
    (onChange) => store.persist.onFinishHydration(onChange),
    () => store.persist.hasHydrated()
  );
}
