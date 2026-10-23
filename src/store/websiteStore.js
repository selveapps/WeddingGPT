import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '../services/storage';
import { WEBSITE_LIMITS, createWebsite, createWebsiteItem, touchEntity } from '../models';

/**
 * The wedding website's content (slice E2). Synced as the `website`
 * collection; every change goes through `touchEntity`, so sync sees it.
 */

const initialState = { website: null };

export const useWebsiteStore = create()(
  persist(
    (set, get) => ({
      ...initialState,

      /** The website record, created on first use. */
      ensure(weddingId) {
        const existing = get().website;
        if (existing) return existing;
        const website = createWebsite({ weddingId });
        set({ website });
        return website;
      },

      update(patch) {
        const { website } = get();
        if (!website) return null;
        const next = touchEntity(website, patch);
        set({ website: next });
        return next;
      },

      addItem(section, fields) {
        const { website } = get();
        if (!website || (website[section] ?? []).length >= WEBSITE_LIMITS.itemsPerSection) return null;
        const item = createWebsiteItem(section, fields);
        get().update({ [section]: [...(website[section] ?? []), item] });
        return item;
      },

      updateItem(section, id, fields) {
        const { website } = get();
        if (!website) return null;
        get().update({
          [section]: (website[section] ?? []).map((item) => (item.id === id ? { ...item, ...fields } : item)),
        });
        return true;
      },

      removeItem(section, id) {
        const { website } = get();
        if (!website) return null;
        get().update({ [section]: (website[section] ?? []).filter((item) => item.id !== id) });
        return true;
      },

      /** Move an item one place up (-1) or down (+1). */
      moveItem(section, id, direction) {
        const list = [...(get().website?.[section] ?? [])];
        const index = list.findIndex((item) => item.id === id);
        const target = index + direction;
        if (index === -1 || target < 0 || target >= list.length) return false;
        [list[index], list[target]] = [list[target], list[index]];
        get().update({ [section]: list });
        return true;
      },

      reset() {
        set({ ...initialState });
      },
    }),
    {
      name: 'website:store',
      storage: zustandStorage,
      version: 1,
      partialize: (state) => ({ website: state.website }),
    }
  )
);

export const selectWebsite = (state) => state.website;
