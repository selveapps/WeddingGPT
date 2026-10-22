import { createCollectionStore } from '../shared/createCollectionStore';

/** A log of merges this phone has applied, newest last. */
export const useLabSyncStore = createCollectionStore({ key: 'sync', prefix: 'lsync' });
