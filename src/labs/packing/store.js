import { denormalise, touchEntity, upsertMany } from '@/models';

import { createCollectionStore } from '../shared/createCollectionStore';
import { itemsFor, missingTemplateItems, templateItems } from './model';

export const useLabPackingStore = createCollectionStore({
  key: 'packing',
  prefix: 'lpack',
  extend: (set, get) => ({
    /** Add a list's template the first time it is opened. Idempotent. */
    ensureSeeded(listKey) {
      const seeded = get().meta.seeded ?? {};
      if (seeded[listKey]) return;
      get().addMany(templateItems(listKey));
      get().setMeta({ seeded: { ...seeded, [listKey]: true } });
    },

    togglePacked(id) {
      return get().update(id, (item) => ({ packed: !item.packed }));
    },

    addCustom(listKey, title) {
      const text = title?.trim();
      if (!text) return null;
      return get().add({ listKey, title: text, packed: false, custom: true });
    },

    restoreDefaults(listKey) {
      return get().addMany(missingTemplateItems(denormalise(get().items), listKey)).length;
    },

    unpackAll(listKey) {
      const packed = itemsFor(denormalise(get().items), listKey).filter((item) => item.packed);
      if (!packed.length) return;
      set((state) => ({
        items: upsertMany(state.items, packed.map((item) => touchEntity(item, { packed: false }))),
      }));
    },
  }),
});
