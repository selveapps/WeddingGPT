import {
  PACKING_LISTS,
  listProgress,
  missingTemplateItems,
  packingText,
  sortForDisplay,
  templateItems,
} from '../model';

const item = (title, fields = {}) => ({ listKey: 'emergency', title, packed: false, custom: false, ...fields });

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
