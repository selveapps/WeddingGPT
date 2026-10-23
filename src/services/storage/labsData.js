/**
 * Reading data saved by a Labs prototype after it has graduated and its code
 * is gone. Labs stores persisted `{ state: { items: { byId, allIds }, meta } }`
 * under `labs:<key>` (see src/labs/shared/createCollectionStore.js).
 */

/** `{ items, meta }` from a persisted Labs value or its JSON; empty for anything damaged. */
export function labsCollectionFromPersisted(value) {
  let persisted = value;
  if (typeof persisted === 'string') {
    try {
      persisted = JSON.parse(persisted);
    } catch {
      return { items: [], meta: {} };
    }
  }
  const collection = persisted?.state?.items;
  const meta = persisted?.state?.meta && typeof persisted.state.meta === 'object' ? persisted.state.meta : {};
  if (!collection?.byId || !Array.isArray(collection.allIds)) return { items: [], meta };
  return { items: collection.allIds.map((id) => collection.byId[id]).filter(Boolean), meta };
}

/**
 * Read a Labs collection and delete it, so it is imported once. Never throws.
 * Resolves `{ items, meta }`.
 */
export async function takeLabsCollection(storage, key) {
  let data = { items: [], meta: {} };
  try {
    data = labsCollectionFromPersisted(await storage.getItem(key));
  } catch {
    // Unreadable Labs data is not worth blocking the real feature over.
  }
  try {
    await storage.removeItem(key);
  } catch {
    // Harmless: the caller's imported-at flag stops a second import.
  }
  return data;
}
