import { createId } from '../lib/id';
import { SyncStatus } from './enums';

/**
 * Shared entity scaffolding.
 *
 * PRD s.22 requires every core entity to carry a stable ID plus created and
 * updated timestamps, and s.23 wants the architecture ready for cloud sync and
 * conflict resolution. `createEntity` and `touchEntity` are the only places
 * those fields are set, so no entity can be created without them.
 *
 * `syncStatus` and `version` are unused by the local-only build on purpose:
 * writing them from day one means adding a backend later does not require a
 * migration of every record the user has already created.
 */

/**
 * Build a new entity with the standard envelope.
 * @param prefix  short entity tag used in the ID, e.g. 'task'
 * @param fields  entity-specific data
 */
export function createEntity(prefix, fields = {}) {
  const now = new Date().toISOString();
  return {
    id: createId(prefix),
    createdAt: now,
    updatedAt: now,
    version: 1,
    syncStatus: SyncStatus.LOCAL_ONLY,
    ...fields,
  };
}

/**
 * Apply a patch and advance the audit fields.
 * Always use this rather than spreading by hand - it is what guarantees
 * `updatedAt` is never stale, which future last-write-wins sync depends on.
 */
export function touchEntity(entity, patch = {}) {
  return {
    ...entity,
    ...patch,
    id: entity.id,
    createdAt: entity.createdAt,
    updatedAt: new Date().toISOString(),
    version: (entity.version ?? 1) + 1,
    syncStatus:
      entity.syncStatus === SyncStatus.SYNCED ? SyncStatus.PENDING_SYNC : entity.syncStatus,
  };
}

/**
 * Normalise a collection into `{ byId, allIds }`.
 *
 * Stores keep collections in this shape rather than as arrays: updating one
 * guest in a list of 300 becomes a single key write instead of a full-array map,
 * and lookups by ID from other slices (an expense pointing at a vendor) are O(1).
 */
export function normalise(items = []) {
  const byId = {};
  const allIds = [];
  for (const item of items) {
    if (!item?.id) continue;
    byId[item.id] = item;
    allIds.push(item.id);
  }
  return { byId, allIds };
}

/**
 * A single shared empty array.
 *
 * Returning a literal `[]` would hand out a new reference on every call, which
 * is exactly the thing the memoisation below exists to avoid.
 */
const EMPTY = Object.freeze([]);

/** Memoised per collection object - see `denormalise`. */
const denormaliseCache = new WeakMap();

/**
 * Back to an array, in `allIds` order.
 *
 * The result is cached against the collection object itself. Collections are
 * immutable (every helper below returns a new one), so a cache hit always means
 * nothing has changed, and repeated calls return the *same* array reference.
 *
 * That reference stability is not an optimisation, it is a correctness
 * requirement: Zustand v5 reads state through `useSyncExternalStore`, which
 * compares snapshots by identity. A selector that built a fresh array each call
 * would look like it changed on every render and React would re-render until it
 * gave up with "Maximum update depth exceeded".
 *
 * A WeakMap means a collection that has been replaced is garbage collected
 * along with its cached array.
 */
export function denormalise(collection) {
  if (!collection?.allIds?.length) return EMPTY;

  const cached = denormaliseCache.get(collection);
  if (cached) return cached;

  const items = collection.allIds.map((id) => collection.byId[id]).filter(Boolean);
  denormaliseCache.set(collection, items);
  return items;
}

/**
 * Build a selector helper that derives a *new* array from a collection - sorted,
 * filtered, grouped - while keeping the same reference stability as
 * `denormalise`. Each derived helper gets its own cache, so
 * `deriveFromCollection` must be called once at module scope, not per render.
 *
 *   const sorted = deriveFromCollection((items) => [...items].sort(byOrder));
 *   export const selectAllCategories = (state) => sorted(state.categories);
 */
export function deriveFromCollection(transform) {
  const cache = new WeakMap();

  return (collection) => {
    if (!collection?.allIds) return EMPTY;

    const cached = cache.get(collection);
    if (cached) return cached;

    const value = transform(denormalise(collection));
    cache.set(collection, value);
    return value;
  };
}

export const emptyCollection = () => ({ byId: {}, allIds: [] });

/** Insert or replace one entity in a normalised collection. */
export function upsert(collection, entity) {
  if (!entity?.id) return collection;
  const exists = Boolean(collection.byId[entity.id]);
  return {
    byId: { ...collection.byId, [entity.id]: entity },
    allIds: exists ? collection.allIds : [...collection.allIds, entity.id],
  };
}

/** Insert or replace many at once - one new object instead of N. */
export function upsertMany(collection, entities = []) {
  const byId = { ...collection.byId };
  const allIds = [...collection.allIds];
  for (const entity of entities) {
    if (!entity?.id) continue;
    if (!byId[entity.id]) allIds.push(entity.id);
    byId[entity.id] = entity;
  }
  return { byId, allIds };
}

export function removeById(collection, id) {
  if (!collection.byId[id]) return collection;
  const byId = { ...collection.byId };
  delete byId[id];
  return { byId, allIds: collection.allIds.filter((existing) => existing !== id) };
}

export function removeManyById(collection, ids = []) {
  const doomed = new Set(ids);
  const byId = { ...collection.byId };
  for (const id of doomed) delete byId[id];
  return { byId, allIds: collection.allIds.filter((id) => !doomed.has(id)) };
}
