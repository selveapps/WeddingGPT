import { importLabVendors, labVendorsFromPersisted, LABS_VENDOR_KEY } from '../labsImport';
import { useVendorStore, selectAllVendors } from '@/store/vendorStore';

const persistedLabs = (items) => ({
  state: {
    items: {
      byId: Object.fromEntries(items.map((item) => [item.id, item])),
      allIds: items.map((item) => item.id),
    },
    meta: {},
  },
  version: 1,
});

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: jest.fn(async (key) => data[key] ?? null),
    removeItem: jest.fn(async (key) => {
      delete data[key];
    }),
  };
}

const lab = (id, name, extra = {}) => ({ id, name, categoryKey: 'venue', status: 'saved', ...extra });

beforeEach(() => {
  useVendorStore.getState().reset();
});

describe('labVendorsFromPersisted', () => {
  it('reads items in order from a persisted value or its JSON', () => {
    const value = persistedLabs([lab('a', 'A'), lab('b', 'B')]);
    expect(labVendorsFromPersisted(value).map((v) => v.name)).toEqual(['A', 'B']);
    expect(labVendorsFromPersisted(JSON.stringify(value)).map((v) => v.name)).toEqual(['A', 'B']);
  });

  it('returns nothing for missing or damaged data', () => {
    expect(labVendorsFromPersisted(null)).toEqual([]);
    expect(labVendorsFromPersisted('{nope')).toEqual([]);
    expect(labVendorsFromPersisted({ state: {} })).toEqual([]);
  });
});

describe('importLabVendors', () => {
  it('copies Labs vendors into the real list once and deletes the Labs data', async () => {
    const storage = memoryStorage({
      [LABS_VENDOR_KEY]: persistedLabs([lab('a', 'Abbey', { contractTotal: 1000 }), lab('b', 'Bloom')]),
    });

    await expect(importLabVendors({ weddingId: 'wed_1', storage })).resolves.toBe(2);
    const vendors = selectAllVendors(useVendorStore.getState());
    expect(vendors.map((v) => [v.name, v.weddingId, v.quotedAmount])).toEqual([
      ['Abbey', 'wed_1', 1000],
      ['Bloom', 'wed_1', null],
    ]);
    expect(storage.data[LABS_VENDOR_KEY]).toBeUndefined();

    // A second run does nothing, even if Labs data reappeared.
    storage.data[LABS_VENDOR_KEY] = persistedLabs([lab('c', 'Cake')]);
    await expect(importLabVendors({ storage })).resolves.toBe(0);
    expect(selectAllVendors(useVendorStore.getState())).toHaveLength(2);
  });

  it('marks the import done even when there is nothing to import', async () => {
    const storage = memoryStorage();
    await expect(importLabVendors({ storage })).resolves.toBe(0);
    expect(useVendorStore.getState().labsImportedAt).toEqual(expect.any(String));
  });

  it('survives storage errors', async () => {
    const storage = {
      getItem: jest.fn(async () => {
        throw new Error('disk');
      }),
      removeItem: jest.fn(async () => {
        throw new Error('disk');
      }),
    };
    await expect(importLabVendors({ storage })).resolves.toBe(0);
    expect(useVendorStore.getState().labsImportedAt).toEqual(expect.any(String));
  });
});
