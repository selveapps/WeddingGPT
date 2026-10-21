import {
  createEntity,
  denormalise,
  deriveFromCollection,
  emptyCollection,
  normalise,
  removeById,
  removeManyById,
  touchEntity,
  upsert,
  upsertMany,
} from '../base';
import { SyncStatus } from '../enums';

const a = { id: 'a', n: 1 };
const b = { id: 'b', n: 2 };
const c = { id: 'c', n: 3 };

describe('createEntity / touchEntity', () => {
  it('adds the standard envelope', () => {
    const entity = createEntity('task', { title: 'Book venue' });
    expect(entity.id).toMatch(/^task_/);
    expect(entity.createdAt).toBe(entity.updatedAt);
    expect(entity.version).toBe(1);
    expect(entity.syncStatus).toBe(SyncStatus.LOCAL_ONLY);
    expect(entity.title).toBe('Book venue');
  });

  it('applies a patch without letting it change identity fields', () => {
    const entity = {
      id: 'x',
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
      version: 3,
    };
    const touched = touchEntity(entity, { id: 'y', createdAt: 'later', title: 'New' });
    expect(touched.id).toBe('x');
    expect(touched.createdAt).toBe(entity.createdAt);
    expect(touched.updatedAt > entity.updatedAt).toBe(true);
    expect(touched.version).toBe(4);
    expect(touched.title).toBe('New');
  });

  it('marks synced entities as pending sync', () => {
    expect(touchEntity({ id: 'x', syncStatus: SyncStatus.SYNCED }).syncStatus).toBe(
      SyncStatus.PENDING_SYNC
    );
    expect(touchEntity({ id: 'x', syncStatus: SyncStatus.LOCAL_ONLY }).syncStatus).toBe(
      SyncStatus.LOCAL_ONLY
    );
  });
});

describe('normalise / denormalise', () => {
  it('round-trips in order and skips items without an id', () => {
    const collection = normalise([a, { n: 9 }, b]);
    expect(collection.allIds).toEqual(['a', 'b']);
    expect(denormalise(collection)).toEqual([a, b]);
  });

  it('returns the same array for the same collection', () => {
    const collection = normalise([a, b]);
    expect(denormalise(collection)).toBe(denormalise(collection));
  });

  it('returns one shared empty array for empty input', () => {
    expect(denormalise(emptyCollection())).toBe(denormalise(null));
  });
});

describe('deriveFromCollection', () => {
  it('memoises the derived value per collection', () => {
    const transform = jest.fn((items) => [...items].reverse());
    const derive = deriveFromCollection(transform);
    const collection = normalise([a, b]);
    expect(derive(collection)).toEqual([b, a]);
    expect(derive(collection)).toBe(derive(collection));
    expect(transform).toHaveBeenCalledTimes(1);
  });
});

describe('upsert / upsertMany', () => {
  it('appends new entities and replaces existing ones in place', () => {
    const start = normalise([a, b]);
    const next = upsert(start, { id: 'a', n: 10 });
    expect(next.allIds).toEqual(['a', 'b']);
    expect(next.byId.a.n).toBe(10);
    expect(start.byId.a.n).toBe(1);
    expect(upsert(start, c).allIds).toEqual(['a', 'b', 'c']);
  });

  it('ignores entities without an id', () => {
    const start = normalise([a]);
    expect(upsert(start, { n: 1 })).toBe(start);
    expect(upsertMany(start, [{ n: 1 }, c]).allIds).toEqual(['a', 'c']);
  });
});

describe('removeById / removeManyById', () => {
  it('removes entities and keeps the rest in order', () => {
    const start = normalise([a, b, c]);
    expect(removeById(start, 'b').allIds).toEqual(['a', 'c']);
    expect(removeManyById(start, ['a', 'c', 'missing']).allIds).toEqual(['b']);
    expect(start.allIds).toEqual(['a', 'b', 'c']);
  });

  it('returns the same collection when nothing is removed', () => {
    const start = normalise([a]);
    expect(removeById(start, 'missing')).toBe(start);
  });
});
