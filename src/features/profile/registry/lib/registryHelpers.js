export const REGISTRY_STATUSES = ['listed', 'reserved', 'received', 'thanked'];

export function validateRegistryItem(values) {
  const errors = {};
  if (!String(values.store ?? '').trim()) errors.store = 'Add a store name.';
  if (!String(values.item ?? '').trim()) errors.item = 'Add an item name.';
  if (values.price !== '' && (!Number.isFinite(Number(values.price)) || Number(values.price) < 0)) {
    errors.price = 'Enter a valid non-negative price.';
  }
  if (values.url && !/^https?:\/\/\S+$/i.test(String(values.url).trim()))
    errors.url = 'Use a full http(s) URL.';
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function normalizeRegistryItem(values) {
  return {
    store: String(values.store ?? '').trim(),
    item: String(values.item ?? '').trim(),
    price: values.price === '' || values.price == null ? '' : Number(values.price),
    url: String(values.url ?? '').trim(),
    status: REGISTRY_STATUSES.includes(values.status) ? values.status : 'listed',
  };
}

export function searchRegistry(records, query) {
  const term = String(query ?? '')
    .trim()
    .toLocaleLowerCase();
  return term
    ? records.filter((record) =>
        [record.store, record.item].some((part) =>
          String(part ?? '')
            .toLocaleLowerCase()
            .includes(term)
        )
      )
    : records;
}

export function sortRegistry(records) {
  return [...records].sort((a, b) => a.store.localeCompare(b.store) || a.item.localeCompare(b.item));
}

export function summarizeRegistry(records) {
  return {
    total: records.length,
    reserved: records.filter((record) => ['reserved', 'received', 'thanked'].includes(record.status)).length,
    thanked: records.filter((record) => record.status === 'thanked').length,
  };
}
