/** Additive selectors for daily — does not replace existing lib files. */
export function filterItems(items = [], { query, status } = {}) {
  let list = Array.isArray(items) ? items.slice() : [];
  if (status && status !== 'all') list = list.filter((i) => i.status === status);
  if (query && String(query).trim()) {
    const q = String(query).trim().toLowerCase();
    list = list.filter((i) =>
      [i.title, i.name, i.label, i.notes, i.description].some((v) =>
        String(v || '').toLowerCase().includes(q)
      )
    );
  }
  return list;
}
export function countBy(items = [], key = 'status') {
  const map = {};
  for (const i of items) {
    const k = i[key] || 'unknown';
    map[k] = (map[k] || 0) + 1;
  }
  return map;
}
