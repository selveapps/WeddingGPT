import { zustandStorage } from '@/services/storage';
import { labsCollectionFromPersisted, takeLabsCollection } from '@/services/storage/labsData';
import { vendorFieldsFromLab } from '@/models';
import { useVendorStore } from '@/store/vendorStore';

/**
 * One-time move of vendors saved in the Labs vendor manager into the real
 * vendor list.
 *
 * The Labs prototype graduated into the Vendors screens, and its code was
 * removed. Anyone who tried it still has its data under `labs:vendors`, so the
 * first time the Vendors screen opens it is read straight from storage,
 * copied across and deleted. `labsImportedAt` makes sure it only ever runs
 * once, even if there was nothing to import.
 */

export const LABS_VENDOR_KEY = 'labs:vendors';

/** The lab vendors inside a persisted `labs:vendors` value, in order. */
export function labVendorsFromPersisted(value) {
  return labsCollectionFromPersisted(value).items;
}

/** Resolves with how many vendors were imported. Never throws. */
export async function importLabVendors({
  weddingId = null,
  store = useVendorStore,
  storage = zustandStorage,
} = {}) {
  if (store.getState().labsImportedAt) return 0;
  const { items: labVendors } = await takeLabsCollection(storage, LABS_VENDOR_KEY);
  const { importVendors, markLabsImported } = store.getState();
  if (labVendors.length) importVendors(labVendors.map((lab) => vendorFieldsFromLab(lab, weddingId)));
  markLabsImported();
  return labVendors.length;
}
