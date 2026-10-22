import {
  SNAPSHOT_FORMAT,
  buildSnapshot,
  decodeSnapshot,
  encodeSnapshot,
  mergeCollection,
  mergeSnapshot,
  pickNewer,
} from '../model';

const rec = (id, updatedAt, extra = {}) => ({ id, updatedAt, version: 1, ...extra });
const col = (...items) => ({
  byId: Object.fromEntries(items.map((item) => [item.id, item])),
  allIds: items.map((item) => item.id),
});

describe('pickNewer', () => {
  it('prefers the later updatedAt, then the higher version, then local', () => {
    const a = rec('x', '2027-01-01T00:00:00Z');
    const b = rec('x', '2027-01-02T00:00:00Z');
    expect(pickNewer(a, b)).toBe(b);
    expect(pickNewer(b, a)).toBe(b);
    expect(pickNewer(a, { ...a, version: 2 }).version).toBe(2);
    const tie = { ...a };
    expect(pickNewer(a, tie)).toBe(a);
  });
});

describe('mergeCollection', () => {
  it('adds, updates and keeps, counting each', () => {
    const local = col(rec('keep', '2027-01-05T00:00:00Z', { title: 'mine' }), rec('old', '2027-01-01T00:00:00Z'));
    const remote = col(
      rec('keep', '2027-01-02T00:00:00Z', { title: 'theirs' }),
      rec('old', '2027-01-09T00:00:00Z', { title: 'fresh' }),
      rec('new', '2027-01-03T00:00:00Z')
    );
    const { collection, stats } = mergeCollection(local, remote);
    expect(stats).toEqual({ added: 1, updated: 1, unchanged: 1 });
    expect(collection.byId.keep.title).toBe('mine');
    expect(collection.byId.old.title).toBe('fresh');
    expect(collection.allIds).toEqual(['keep', 'old', 'new']);
  });
});

describe('snapshots', () => {
  it('round-trips through encode/decode', () => {
    const snapshot = buildSnapshot(
      { collections: { guests: col(rec('g', '2027-01-01T00:00:00Z')) }, singletons: { wedding: { id: 'w' } } },
      { deviceName: 'Sam', now: new Date('2027-01-10T00:00:00Z') }
    );
    const decoded = decodeSnapshot(encodeSnapshot(snapshot));
    expect(decoded.ok).toBe(true);
    expect(decoded.snapshot.collections.guests.allIds).toEqual(['g']);
    expect(decoded.snapshot.collections.tasks.allIds).toEqual([]);
    expect(decoded.snapshot.deviceName).toBe('Sam');
  });

  it('rejects junk, other formats, newer versions and damaged sections', () => {
    expect(decodeSnapshot('hello').ok).toBe(false);
    expect(decodeSnapshot('{"format":"other"}').ok).toBe(false);
    expect(decodeSnapshot(JSON.stringify({ format: SNAPSHOT_FORMAT, version: 99 })).ok).toBe(false);
    expect(
      decodeSnapshot(JSON.stringify({ format: SNAPSHOT_FORMAT, version: 1, collections: { tasks: [] } })).ok
    ).toBe(false);
  });
});

describe('mergeSnapshot', () => {
  it('totals changes and flags different weddings', () => {
    const local = buildSnapshot({ singletons: { wedding: rec('w1', '2027-01-01T00:00:00Z') } });
    const remote = buildSnapshot({
      collections: { tasks: col(rec('t', '2027-01-01T00:00:00Z')) },
      singletons: { wedding: rec('w2', '2027-01-02T00:00:00Z') },
    });
    const result = mergeSnapshot(local, remote);
    expect(result.sameWedding).toBe(false);
    expect(result.stats.tasks.added).toBe(1);
    expect(result.stats.wedding.updated).toBe(1);
    expect(result.changes).toBe(2);
  });

  it('is a no-op when merging a plan with itself', () => {
    const snap = buildSnapshot({
      collections: { guests: col(rec('g', '2027-01-01T00:00:00Z')) },
      singletons: { wedding: rec('w', '2027-01-01T00:00:00Z') },
    });
    expect(mergeSnapshot(snap, decodeSnapshot(encodeSnapshot(snap)).snapshot).changes).toBe(0);
  });
});
