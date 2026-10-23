import { SliceKind, allAsUpserts, applyRecords, diffSlice, recordKey } from '../changes';

const a = { id: 'a', n: 1 };
const b = { id: 'b', n: 2 };
const many = (...items) => ({
  byId: Object.fromEntries(items.map((i) => [i.id, i])),
  allIds: items.map((i) => i.id),
});

describe('diffSlice', () => {
  it('finds new, changed and removed entities by reference', () => {
    const before = many(a, b);
    const changedA = { ...a, n: 9 };
    const c = { id: 'c' };
    const after = many(changedA, c);
    expect(diffSlice(SliceKind.MANY, before, after)).toEqual([
      { op: 'upsert', id: 'a', data: changedA },
      { op: 'upsert', id: 'c', data: c },
      { op: 'delete', id: 'b' },
    ]);
  });

  it('reports nothing when the slice or its entities are the same objects', () => {
    const slice = many(a, b);
    expect(diffSlice(SliceKind.MANY, slice, slice)).toEqual([]);
    expect(diffSlice(SliceKind.MANY, slice, { ...slice, byId: { ...slice.byId } })).toEqual([]);
  });

  it('handles single entities, including replacement by a different id', () => {
    expect(diffSlice(SliceKind.ONE, null, a)).toEqual([{ op: 'upsert', id: 'a', data: a }]);
    expect(diffSlice(SliceKind.ONE, a, null)).toEqual([{ op: 'delete', id: 'a' }]);
    expect(diffSlice(SliceKind.ONE, a, b)).toEqual([
      { op: 'delete', id: 'a' },
      { op: 'upsert', id: 'b', data: b },
    ]);
    expect(diffSlice(SliceKind.ONE, null, null)).toEqual([]);
  });

  it('treats a missing collection as empty', () => {
    expect(diffSlice(SliceKind.MANY, undefined, many(a))).toEqual([{ op: 'upsert', id: 'a', data: a }]);
  });
});

describe('applyRecords', () => {
  it('upserts and deletes, appending new records in pull order', () => {
    const result = applyRecords(SliceKind.MANY, many(a, b), [
      { id: 'c', deletedAt: null, data: { id: 'c' } },
      { id: 'a', deletedAt: '2027-01-01', data: null },
      { id: 'b', deletedAt: null, data: { id: 'b', n: 5 } },
    ]);
    expect(result.allIds).toEqual(['b', 'c']);
    expect(result.byId.b.n).toBe(5);
  });

  it('ignores deletes of records it does not have, and returns the same slice for no records', () => {
    const slice = many(a);
    expect(applyRecords(SliceKind.MANY, slice, [{ id: 'zzz', deletedAt: 'x' }])).toEqual(slice);
    expect(applyRecords(SliceKind.MANY, slice, [])).toBe(slice);
  });

  it('sets or clears a single entity', () => {
    expect(applyRecords(SliceKind.ONE, null, [{ id: 'a', deletedAt: null, data: a }])).toBe(a);
    expect(applyRecords(SliceKind.ONE, a, [{ id: 'a', deletedAt: 'x', data: null }])).toBeNull();
    expect(applyRecords(SliceKind.ONE, a, [{ id: 'other', deletedAt: 'x', data: null }])).toBe(a);
  });
});

describe('allAsUpserts and recordKey', () => {
  it('lists every entity as an upsert', () => {
    expect(allAsUpserts(SliceKind.MANY, many(a, b)).map((c) => c.id)).toEqual(['a', 'b']);
    expect(allAsUpserts(SliceKind.ONE, a)).toEqual([{ op: 'upsert', id: 'a', data: a }]);
    expect(allAsUpserts(SliceKind.ONE, null)).toEqual([]);
  });

  it('keys records by collection and id', () => {
    expect(recordKey('tasks', 'task_1')).toBe('tasks:task_1');
  });
});
