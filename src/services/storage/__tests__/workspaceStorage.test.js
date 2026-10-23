/* global __dirname -- Jest runs tests in Node, which provides it. */
import fs from 'fs';
import path from 'path';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createMemoryStorageService } from '../memoryStorageService';
import {
  ACTIVE_WORKSPACE_KEY,
  LOCAL_WORKSPACE,
  createWorkspaceStorage,
  workspaceKey,
} from '../workspaceStorage';

/** A small persisted store shaped like the app's: a list and an action. */
function makeStore(workspaces, name = 'guests:store') {
  const store = create()(
    persist(
      (set) => ({
        guests: [],
        addGuest: (guest) => set((state) => ({ guests: [...state.guests, guest] })),
      }),
      { name, storage: workspaces.adapter, partialize: (state) => ({ guests: state.guests }) }
    )
  );
  return workspaces.register(store);
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

async function setup(initial = {}) {
  const storage = createMemoryStorageService();
  for (const [key, value] of Object.entries(initial)) await storage.set(key, value);
  const workspaces = createWorkspaceStorage(storage);
  const store = makeStore(workspaces);
  await workspaces.ready;
  await store.persist.rehydrate();
  return { storage, workspaces, store };
}

const names = (store) => store.getState().guests.map((guest) => guest.name);

describe('workspaceKey', () => {
  it('keeps the original key for the local workspace and prefixes the rest', () => {
    expect(workspaceKey(LOCAL_WORKSPACE, 'guests:store')).toBe('guests:store');
    expect(workspaceKey('ws_1', 'guests:store')).toBe('ws:ws_1:guests:store');
  });
});

describe('createWorkspaceStorage', () => {
  it('reads data saved before workspaces existed as the local workspace', async () => {
    const { store, workspaces } = await setup({
      'guests:store': { state: { guests: [{ name: 'Meera' }] }, version: 0 },
    });
    expect(workspaces.getActive()).toBe(LOCAL_WORKSPACE);
    expect(names(store)).toEqual(['Meera']);
  });

  it('writes to the active workspace only', async () => {
    const { store, storage, workspaces } = await setup();
    store.getState().addGuest({ name: 'Local guest' });
    await settle();
    await workspaces.switchTo('ws_a');
    store.getState().addGuest({ name: 'A guest' });
    await settle();

    expect((await storage.get('guests:store')).state.guests).toEqual([{ name: 'Local guest' }]);
    expect((await storage.get('ws:ws_a:guests:store')).state.guests).toEqual([{ name: 'A guest' }]);
  });

  it("never shows one workspace's data in another, in either direction", async () => {
    const { store, workspaces } = await setup();
    await workspaces.switchTo('ws_a');
    store.getState().addGuest({ name: 'Only in A' });
    await settle();

    // B has nothing saved. zustand would keep A's guests in memory here.
    await workspaces.switchTo('ws_b');
    expect(names(store)).toEqual([]);
    store.getState().addGuest({ name: 'Only in B' });
    await settle();

    await workspaces.switchTo('ws_a');
    expect(names(store)).toEqual(['Only in A']);
    await workspaces.switchTo('ws_b');
    expect(names(store)).toEqual(['Only in B']);
    await workspaces.switchTo(LOCAL_WORKSPACE);
    expect(names(store)).toEqual([]);
  });

  it('switching to the active workspace does nothing', async () => {
    const { store, workspaces } = await setup();
    store.getState().addGuest({ name: 'Keep me' });
    const listener = jest.fn();
    workspaces.subscribe(listener);
    await workspaces.switchTo(LOCAL_WORKSPACE);
    expect(names(store)).toEqual(['Keep me']);
    expect(listener).not.toHaveBeenCalled();
  });

  it('remembers the active workspace across launches, before stores hydrate', async () => {
    const { storage, workspaces, store } = await setup();
    await workspaces.switchTo('ws_a');
    store.getState().addGuest({ name: 'Saved in A' });
    await settle();
    expect(await storage.get(ACTIVE_WORKSPACE_KEY)).toBe('ws_a');

    // Next launch: a new instance over the same storage.
    const relaunched = createWorkspaceStorage(storage);
    const nextStore = makeStore(relaunched);
    await relaunched.ready;
    await nextStore.persist.rehydrate();
    expect(relaunched.getActive()).toBe('ws_a');
    expect(names(nextStore)).toEqual(['Saved in A']);
  });

  it('falls back to local when the saved workspace id is damaged', async () => {
    const storage = createMemoryStorageService();
    await storage.set(ACTIVE_WORKSPACE_KEY, '../../etc');
    const workspaces = createWorkspaceStorage(storage);
    await workspaces.ready;
    expect(workspaces.getActive()).toBe(LOCAL_WORKSPACE);
  });

  it('notifies subscribers after a switch', async () => {
    const { workspaces } = await setup();
    const listener = jest.fn();
    const unsubscribe = workspaces.subscribe(listener);
    await workspaces.switchTo('ws_a');
    unsubscribe();
    await workspaces.switchTo('ws_b');
    expect(listener.mock.calls).toEqual([['ws_a']]);
  });

  it('rejects invalid workspace ids', async () => {
    const { workspaces } = await setup();
    await expect(workspaces.switchTo('')).rejects.toThrow();
    await expect(workspaces.switchTo('a/b')).rejects.toThrow();
    await expect(workspaces.clear(null)).rejects.toThrow();
  });

  describe('clear', () => {
    it('removes only the given workspace', async () => {
      const { store, storage, workspaces } = await setup();
      await workspaces.switchTo('ws_a');
      store.getState().addGuest({ name: 'A' });
      await settle();
      await workspaces.switchTo('ws_b');
      store.getState().addGuest({ name: 'B' });
      await settle();

      expect(await workspaces.clear('ws_a')).toBe(1);
      expect(await storage.get('ws:ws_a:guests:store')).toBeNull();
      expect((await storage.get('ws:ws_b:guests:store')).state.guests).toEqual([{ name: 'B' }]);
      expect(names(store)).toEqual(['B']);
    });

    it('empties the stores when clearing the active workspace, without writing it back', async () => {
      const { store, storage, workspaces } = await setup();
      await workspaces.switchTo('ws_a');
      store.getState().addGuest({ name: 'A' });
      await settle();

      await workspaces.clear('ws_a');
      await settle();
      expect(names(store)).toEqual([]);
      expect(await storage.get('ws:ws_a:guests:store')).toBeNull();
    });

    it('clears the local workspace by store name, leaving device settings alone', async () => {
      const { store, storage, workspaces } = await setup({ 'preferences:app': { theme: 'dark' } });
      store.getState().addGuest({ name: 'Local' });
      await settle();

      await workspaces.clear(LOCAL_WORKSPACE);
      expect(await storage.get('guests:store')).toBeNull();
      expect(await storage.get('preferences:app')).toEqual({ theme: 'dark' });
    });
  });
});

describe('app wiring', () => {
  const SRC = path.join(__dirname, '../../..');

  function sourceFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
      return /\.jsx?$/.test(entry.name) ? [full] : [];
    });
  }

  it('every persisted store is registered to switch with the workspace', () => {
    // A store that persists through zustandStorage but is not registered would
    // keep one workspace's data on screen after switching to another.
    const persisting = sourceFiles(SRC)
      .filter((file) => fs.readFileSync(file, 'utf8').includes('storage: zustandStorage'))
      .map((file) => path.relative(SRC, file).replace(/\\/g, '/'))
      .sort();

    const coreStores = fs.readFileSync(path.join(SRC, 'store/index.js'), 'utf8');
    const collectionFactory = fs.readFileSync(path.join(SRC, 'labs/shared/createCollectionStore.js'), 'utf8');
    expect(collectionFactory).toMatch(/workspaceStorage\.register\(/);
    expect(coreStores).toMatch(/STORES\.forEach\(\(store\) => workspaceStorage\.register\(store\)\)/);

    for (const file of persisting) {
      if (file === 'labs/shared/createCollectionStore.js') continue;
      const exported = /export const (use\w+Store) = create/.exec(
        fs.readFileSync(path.join(SRC, file), 'utf8')
      );
      expect(exported).not.toBeNull();
      expect(coreStores).toMatch(new RegExp(`^  ${exported[1]},$`, 'm'));
    }
  });

  it('switching the real app stores starts the new workspace empty', async () => {
    const { workspaceStorage } = require('../index');
    const { useVendorStore, useGuestStore, selectAllVendors } = require('../../../store');

    await workspaceStorage.ready;
    useVendorStore.getState().addVendor({ name: 'Local vendor' });
    await workspaceStorage.switchTo('ws_test');
    expect(selectAllVendors(useVendorStore.getState())).toEqual([]);
    expect(useGuestStore.getState().guests.allIds).toEqual([]);

    await workspaceStorage.switchTo(LOCAL_WORKSPACE);
    expect(selectAllVendors(useVendorStore.getState()).map((v) => v.name)).toEqual(['Local vendor']);
  });
});
