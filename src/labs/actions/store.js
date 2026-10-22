import { createCollectionStore } from '../shared/createCollectionStore';

/** What has been applied from this screen, newest last. */
export const useLabActionStore = createCollectionStore({ key: 'actions', prefix: 'lact' });
