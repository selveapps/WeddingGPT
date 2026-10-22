/**
 * Partner sync (Labs).
 *
 * Until there is a sync server, two phones share a plan by swapping a
 * snapshot: one exports, the other previews and merges. The merge is the same
 * rule a server would apply - last write wins per record, by `updatedAt` then
 * `version` - which is what the `updatedAt`/`version` fields on every entity
 * were put there for (see models/base.js).
 *
 * Deletions do not travel: there are no tombstones yet, so a record deleted on
 * one phone survives a merge from the other. That is the known gap to close
 * before this graduates.
 */

export const SNAPSHOT_FORMAT = 'weddinggpt-snapshot';
export const SNAPSHOT_VERSION = 1;

export const SYNC_COLLECTIONS = [
  { key: 'tasks', label: 'Tasks' },
  { key: 'taskCategories', label: 'Task categories' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'budgetCategories', label: 'Budget categories' },
  { key: 'guests', label: 'Guests' },
  { key: 'households', label: 'Households' },
];

export const SYNC_SINGLETONS = [
  { key: 'wedding', label: 'Wedding details' },
  { key: 'budget', label: 'Budget total' },
];

const emptyCollection = () => ({ byId: {}, allIds: [] });

export function buildSnapshot({ collections = {}, singletons = {} } = {}, { deviceName = '', now = new Date() } = {}) {
  const out = { format: SNAPSHOT_FORMAT, version: SNAPSHOT_VERSION, exportedAt: now.toISOString(), deviceName };
  out.collections = Object.fromEntries(
    SYNC_COLLECTIONS.map(({ key }) => [key, collections[key] ?? emptyCollection()])
  );
  out.singletons = Object.fromEntries(SYNC_SINGLETONS.map(({ key }) => [key, singletons[key] ?? null]));
  return out;
}

export function encodeSnapshot(snapshot) {
  return JSON.stringify(snapshot);
}

function isCollection(value) {
  return Boolean(value) && typeof value.byId === 'object' && Array.isArray(value.allIds);
}

/** Parse pasted text. Never throws: returns `{ ok, snapshot }` or `{ ok: false, error }`. */
export function decodeSnapshot(text) {
  let parsed;
  try {
    parsed = JSON.parse((text ?? '').trim());
  } catch {
    return { ok: false, error: 'That is not a WeddingGPT plan - check you copied all of it.' };
  }
  if (parsed?.format !== SNAPSHOT_FORMAT) {
    return { ok: false, error: 'That is not a WeddingGPT plan.' };
  }
  if (parsed.version > SNAPSHOT_VERSION) {
    return { ok: false, error: 'This plan came from a newer version of the app. Update first.' };
  }
  for (const { key } of SYNC_COLLECTIONS) {
    if (parsed.collections?.[key] !== undefined && !isCollection(parsed.collections[key])) {
      return { ok: false, error: `The ${key} section of that plan is damaged.` };
    }
  }
  const exportedAt = new Date(parsed.exportedAt);
  return {
    ok: true,
    snapshot: buildSnapshot(parsed, {
      deviceName: typeof parsed.deviceName === 'string' ? parsed.deviceName : '',
      now: Number.isNaN(exportedAt.getTime()) ? new Date() : exportedAt,
    }),
  };
}

/**
 * Last write wins. Returns `remote` only when it is strictly newer, so a tie
 * keeps what is already on this phone.
 */
export function pickNewer(local, remote) {
  if (!remote) return local;
  if (!local) return remote;
  const a = local.updatedAt ?? '';
  const b = remote.updatedAt ?? '';
  if (b > a) return remote;
  if (b < a) return local;
  return (remote.version ?? 0) > (local.version ?? 0) ? remote : local;
}

export function mergeCollection(local = emptyCollection(), remote = emptyCollection()) {
  const byId = { ...local.byId };
  const allIds = [...local.allIds];
  const stats = { added: 0, updated: 0, unchanged: 0 };

  for (const id of remote.allIds) {
    const incoming = remote.byId[id];
    if (!incoming) continue;
    const existing = byId[id];
    if (!existing) {
      byId[id] = incoming;
      allIds.push(id);
      stats.added++;
    } else if (pickNewer(existing, incoming) === incoming && incoming !== existing) {
      byId[id] = incoming;
      stats.updated++;
    } else {
      stats.unchanged++;
    }
  }

  return { collection: { byId, allIds }, stats };
}

/**
 * Merge a decoded snapshot into this phone's data. Pure: returns the merged
 * slices and a per-section change count for the preview.
 */
export function mergeSnapshot(local, remote) {
  const collections = {};
  const stats = {};

  for (const { key } of SYNC_COLLECTIONS) {
    const result = mergeCollection(local.collections?.[key], remote.collections?.[key]);
    collections[key] = result.collection;
    stats[key] = result.stats;
  }

  const singletons = {};
  for (const { key } of SYNC_SINGLETONS) {
    const mine = local.singletons?.[key] ?? null;
    const theirs = remote.singletons?.[key] ?? null;
    const chosen = pickNewer(mine, theirs);
    singletons[key] = chosen;
    stats[key] = { updated: chosen && chosen !== mine ? 1 : 0, added: 0, unchanged: chosen === mine ? 1 : 0 };
  }

  const localWedding = local.singletons?.wedding?.id;
  const remoteWedding = remote.singletons?.wedding?.id;

  return {
    collections,
    singletons,
    stats,
    /** False when both phones have a wedding and they are different ones. */
    sameWedding: !localWedding || !remoteWedding || localWedding === remoteWedding,
    changes: Object.values(stats).reduce((sum, entry) => sum + entry.added + entry.updated, 0),
  };
}
