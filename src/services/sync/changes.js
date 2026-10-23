/**
 * Pure helpers for turning store changes into sync mutations, and pulled
 * records back into store state (design M1 §4).
 *
 * Stores keep collections as immutable `{ byId, allIds }` and replace an
 * entity object whenever it changes (`touchEntity`), so a change is simply a
 * different object reference. That lets sync observe every store without
 * touching any of their actions.
 */

export const SliceKind = {
  /** A normalised `{ byId, allIds }` collection. */
  MANY: 'many',
  /** One entity or null, such as the wedding itself. */
  ONE: 'one',
};

export const recordKey = (collection, id) => `${collection}:${id}`;

/**
 * What changed between two values of one slice.
 * Returns `[{ op: 'upsert', id, data } | { op: 'delete', id }]`.
 */
export function diffSlice(kind, previous, next) {
  if (previous === next) return [];

  if (kind === SliceKind.ONE) {
    const changes = [];
    if (previous && (!next || previous.id !== next.id)) changes.push({ op: 'delete', id: previous.id });
    if (next?.id) changes.push({ op: 'upsert', id: next.id, data: next });
    return changes;
  }

  const before = previous?.byId ?? {};
  const after = next?.byId ?? {};
  const changes = [];
  for (const [id, entity] of Object.entries(after)) {
    if (before[id] !== entity) changes.push({ op: 'upsert', id, data: entity });
  }
  for (const id of Object.keys(before)) {
    if (!(id in after)) changes.push({ op: 'delete', id });
  }
  return changes;
}

/**
 * Apply pulled records (`{ id, deletedAt, data }`, all for this slice) to a
 * slice value. New records are appended in pull order; deletes remove.
 */
export function applyRecords(kind, slice, records) {
  if (!records.length) return slice;

  if (kind === SliceKind.ONE) {
    let value = slice;
    for (const record of records) {
      if (record.deletedAt) {
        if (value?.id === record.id) value = null;
      } else {
        value = record.data;
      }
    }
    return value;
  }

  const byId = { ...(slice?.byId ?? {}) };
  const allIds = [...(slice?.allIds ?? [])];
  for (const record of records) {
    if (record.deletedAt) {
      if (record.id in byId) {
        delete byId[record.id];
        const index = allIds.indexOf(record.id);
        if (index !== -1) allIds.splice(index, 1);
      }
    } else {
      if (!(record.id in byId)) allIds.push(record.id);
      byId[record.id] = record.data;
    }
  }
  return { byId, allIds };
}

/** Every entity in a slice, as upserts - for the first upload of a workspace. */
export function allAsUpserts(kind, slice) {
  if (kind === SliceKind.ONE) return slice?.id ? [{ op: 'upsert', id: slice.id, data: slice }] : [];
  return (slice?.allIds ?? [])
    .map((id) => slice.byId[id])
    .filter(Boolean)
    .map((entity) => ({ op: 'upsert', id: entity.id, data: entity }));
}
