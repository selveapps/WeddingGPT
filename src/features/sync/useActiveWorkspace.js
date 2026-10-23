import { useSyncExternalStore } from 'react';

import { workspaceStorage } from '@/services/storage';

/** The active workspace id ('local' when signed out), re-rendering on every switch. */
export function useActiveWorkspace() {
  return useSyncExternalStore(
    workspaceStorage.subscribe,
    workspaceStorage.getActive,
    workspaceStorage.getActive
  );
}

export default useActiveWorkspace;
