/** Selectors for planning */
export function filterItems(items = [], { query, status } = {}) {
  let list = items.slice();
  if (status && status !== 'all') list = list.filter((i) => i.status === status);
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    list = list.filter((i) =>
      [i.title, i.name, i.label, i.notes].some((v) => String(v || '').toLowerCase().includes(q))
    );
  }
  return list;
}

export function countByStatus(items = []) {
  const map = {};
  for (const i of items) {
    const s = i.status || 'unknown';
    map[s] = (map[s] || 0) + 1;
  }
  return map;
}
