import {
  PACKING_LISTS,
  listProgress,
  missingTemplateItems,
  packingText,
  sortForDisplay,
  templateItems,
  templateItemId,
  templatePackingItems,
  createPackingItem,
  packingSummary,
} from '../packing';

const item = (title, fields = {}) => ({
  listKey: 'emergency',
  title,
  packed: false,
  custom: false,
  ...fields,
});

it('has unique keys and non-empty templates', () => {
  expect(new Set(PACKING_LISTS.map((l) => l.key)).size).toBe(PACKING_LISTS.length);
  for (const list of PACKING_LISTS) expect(templateItems(list.key).length).toBeGreaterThan(0);
});

it('measures progress for one list only', () => {
  const items = [item('a', { packed: true }), item('b'), item('c', { listKey: 'venue', packed: true })];
  expect(listProgress(items, 'emergency')).toEqual({ packed: 1, total: 2, ratio: 0.5 });
  expect(listProgress([], 'emergency').ratio).toBe(0);
});

it('finds deleted template items, ignoring case', () => {
  const all = templateItems('honeymoon');
  const kept = all.slice(1).map((entry) => ({ ...entry, title: entry.title.toUpperCase() }));
  expect(missingTemplateItems(kept, 'honeymoon').map((i) => i.title)).toEqual([all[0].title]);
});

it('shows unpacked items before packed ones, keeping order', () => {
  const sorted = sortForDisplay([item('a', { packed: true }), item('b'), item('c')]);
  expect(sorted.map((i) => i.title)).toEqual(['b', 'c', 'a']);
});

it('shares a checklist', () => {
  expect(packingText([item('Pins', { packed: true }), item('Mints')], 'emergency')).toBe(
    'Emergency kit\n\n[x] Pins\n[ ] Mints'
  );
});

it('gives template items the same ids on every phone', () => {
  const a = templatePackingItems('emergency', 'w1');
  const b = templatePackingItems('emergency', 'w1');
  expect(a.map((i) => i.id)).toEqual(b.map((i) => i.id));
  expect(a[0].id).toBe(templateItemId('emergency', 'Safety pins'));
  expect(a[0].id).toBe('pack_emergency_safety_pins');
  expect(new Set(a.map((i) => i.id)).size).toBe(a.length);
  for (const list of PACKING_LISTS) {
    const ids = templatePackingItems(list.key, 'w1').map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_-]{1,128}$/);
  }
});

it('makes custom items with fresh ids and trims titles', () => {
  const made = createPackingItem({ weddingId: 'w1', listKey: 'venue', title: '  Bunting ' });
  expect(made).toMatchObject({ title: 'Bunting', packed: false, custom: true, weddingId: 'w1' });
  expect(made.id).toMatch(/^pack_/);
  expect(createPackingItem({ listKey: 'venue', title: 'x'.repeat(500) }).title).toHaveLength(120);
});

it('summarises every list', () => {
  const summary = packingSummary([item('a', { packed: true }), item('b')]);
  expect(summary.find((l) => l.key === 'emergency')).toMatchObject({ packed: 1, total: 2 });
  expect(summary.find((l) => l.key === 'venue').total).toBe(0);
});
