import { usePackingStore, selectPackingItems } from '@/store';
import { PACKING_LIMITS, itemsFor, templateItems } from '@/models';
import { importLabPacking, LABS_PACKING_KEY } from '@/features/packing/labsImport';

const store = () => usePackingStore.getState();
const list = (key) => itemsFor(selectPackingItems(store()), key);

beforeEach(() => store().reset());

describe('packingStore', () => {
  it('starts a list from its template once, however often it is asked', () => {
    const count = templateItems('honeymoon').length;
    expect(store().startFromTemplate('honeymoon', 'w1')).toBe(count);
    expect(store().startFromTemplate('honeymoon', 'w1')).toBe(0);
    expect(list('honeymoon')).toHaveLength(count);
    expect(list('venue')).toEqual([]);
  });

  it('two phones starting the same list end up with one copy', () => {
    store().startFromTemplate('emergency', 'w1');
    const fromPhoneA = selectPackingItems(store());
    store().reset();
    store().startFromTemplate('emergency', 'w1');
    // What phone B pulls from A has the same ids, so it adds nothing new.
    const ids = new Set(selectPackingItems(store()).map((i) => i.id));
    expect(fromPhoneA.every((item) => ids.has(item.id))).toBe(true);
  });

  it('ticks, renames, removes and restores items', () => {
    store().startFromTemplate('emergency', 'w1');
    const [pins] = list('emergency');
    expect(store().togglePacked(pins.id).packed).toBe(true);
    expect(store().renameItem(pins.id, '  Gold safety pins ').title).toBe('Gold safety pins');
    expect(store().renameItem(pins.id, ' ')).toBeNull();

    const removed = store().togglePacked(pins.id);
    store().removeItem(pins.id);
    expect(list('emergency').some((i) => i.id === pins.id)).toBe(false);
    expect(store().restoreItem(removed).id).toBe(pins.id);
    expect(store().restoreItem(removed)).toBeNull();
  });

  it('puts back removed template items, and only those', () => {
    store().startFromTemplate('venue', 'w1');
    const [first, second] = list('venue');
    store().removeItem(first.id);
    store().removeItem(second.id);
    store().addCustom('venue', 'Bunting', 'w1');
    expect(store().restoreDefaults('venue', 'w1')).toBe(2);
    expect(list('venue').map((i) => i.id)).toEqual(expect.arrayContaining([first.id, second.id]));
    expect(store().restoreDefaults('venue', 'w1')).toBe(0);
  });

  it('adds custom items up to the limit, ignoring blanks', () => {
    expect(store().addCustom('venue', '  ', 'w1')).toBeNull();
    for (let i = 0; i < PACKING_LIMITS.perList; i += 1) store().addCustom('venue', `Thing ${i}`, 'w1');
    expect(store().addCustom('venue', 'One more', 'w1')).toBeNull();
  });

  it('unpacks one list only', () => {
    store().startFromTemplate('venue', 'w1');
    store().startFromTemplate('emergency', 'w1');
    list('venue').forEach((i) => store().togglePacked(i.id));
    store().togglePacked(list('emergency')[0].id);
    expect(store().unpackAll('venue')).toBe(list('venue').length);
    expect(list('venue').every((i) => !i.packed)).toBe(true);
    expect(list('emergency')[0].packed).toBe(true);
  });
});

describe('importLabPacking', () => {
  it('brings Labs items over once, ticks and all, without doubling template items', async () => {
    const items = [
      { id: 'lpack_1', listKey: 'emergency', title: 'Safety pins', packed: true, custom: false },
      { id: 'lpack_2', listKey: 'emergency', title: 'Safety pins', packed: true, custom: false },
      { id: 'lpack_3', listKey: 'emergency', title: 'Lucky coin', packed: false, custom: true },
      { id: 'lpack_4', listKey: '', title: 'No list' },
    ];
    const data = new Map([
      [
        LABS_PACKING_KEY,
        JSON.stringify({
          state: {
            items: { byId: Object.fromEntries(items.map((i) => [i.id, i])), allIds: items.map((i) => i.id) },
          },
        }),
      ],
    ]);
    const storage = {
      getItem: async (key) => data.get(key) ?? null,
      removeItem: async (key) => data.delete(key),
    };

    expect(await importLabPacking({ weddingId: 'w1', storage })).toBe(2);
    const imported = list('emergency');
    expect(imported.find((i) => i.title === 'Safety pins')).toMatchObject({
      id: 'pack_emergency_safety_pins',
      packed: true,
    });
    expect(imported.find((i) => i.title === 'Lucky coin').custom).toBe(true);
    // Starting the list afterwards adds the rest but not a second "Safety pins".
    store().startFromTemplate('emergency', 'w1');
    expect(list('emergency').filter((i) => i.title === 'Safety pins')).toHaveLength(1);
    expect(data.has(LABS_PACKING_KEY)).toBe(false);
  });
});
