import { createEntity } from './base';

/**
 * Packing lists and the day-of emergency kit (graduated from Labs). Items
 * sync as `packingItems`, so whoever is packing the car sees what is in.
 *
 * Items are `{ listKey, title, packed, custom }` - `custom` marks things the
 * couple added themselves. A list starts from its template only when the
 * couple asks. Template items get ids made from the list and the title, so two
 * phones starting the same list at once end up with one copy, not two.
 */

export const PACKING_LIMITS = {
  titleChars: 120,
  perList: 150,
};

export const PACKING_LISTS = [
  {
    key: 'emergency',
    label: 'Emergency kit',
    items: [
      'Safety pins',
      'Sewing kit in outfit colours',
      'Fashion tape',
      'Stain remover pen',
      'Pain relief',
      'Plasters and blister pads',
      'Tissues',
      'Phone charger and power bank',
      'Mints',
      'Hair pins and hairspray',
      'Lip colour and powder for touch-ups',
      'Deodorant',
      'Small scissors',
      'Snacks and water',
      'Umbrella',
      'Cash for tips',
    ],
  },
  {
    key: 'ready',
    label: 'Getting-ready bag',
    items: [
      'Outfits and accessories',
      'Shoes (and a comfortable spare pair)',
      'Rings',
      'Vows',
      'Underwear and shapewear',
      'Something to wear while getting ready',
      'Perfume or cologne',
      'Marriage licence',
      'Vendor contact list',
      'Overnight bag',
    ],
  },
  {
    key: 'venue',
    label: 'For the venue',
    items: [
      'Guest book and pens',
      'Place cards and seating chart',
      'Table numbers',
      'Signage',
      'Card box',
      'Favors',
      'Decor and candles',
      'Cake knife and server',
      'Toasting glasses',
      'Music playlist and do-not-play list',
      'Final payments and vendor tips in envelopes',
    ],
  },
  {
    key: 'honeymoon',
    label: 'Honeymoon',
    items: [
      'Passports and ID',
      'Travel documents and bookings',
      'Travel insurance details',
      'Medication',
      'Adapters and chargers',
      'Sunscreen',
      'Swimwear',
      'Something smart for dinner',
      'Copies of documents',
    ],
  },
];

export function listByKey(key) {
  return PACKING_LISTS.find((list) => list.key === key) ?? null;
}

export function templateItems(listKey) {
  return (listByKey(listKey)?.items ?? []).map((title) => ({ listKey, title, packed: false, custom: false }));
}

const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60);

/** The id a template item always gets, on every phone. */
export const templateItemId = (listKey, title) => `pack_${listKey}_${slug(title)}`;

export function createPackingItem({
  weddingId,
  listKey,
  title = '',
  packed = false,
  custom = true,
  id = null,
} = {}) {
  const item = createEntity('pack', {
    weddingId,
    listKey,
    title: String(title).trim().slice(0, PACKING_LIMITS.titleChars),
    packed: Boolean(packed),
    custom,
  });
  return id ? { ...item, id } : item;
}

/** Template items as entities with their stable ids. */
export function templatePackingItems(listKey, weddingId) {
  return templateItems(listKey).map((entry) =>
    createPackingItem({ ...entry, weddingId, id: templateItemId(listKey, entry.title) })
  );
}

export function itemsFor(items = [], listKey) {
  return items.filter((item) => item.listKey === listKey);
}

export function listProgress(items = [], listKey) {
  const list = itemsFor(items, listKey);
  const packed = list.filter((item) => item.packed).length;
  return { packed, total: list.length, ratio: list.length ? packed / list.length : 0 };
}

/** Template items the couple has deleted, for "restore the defaults". */
export function missingTemplateItems(items = [], listKey) {
  const have = new Set(itemsFor(items, listKey).map((item) => item.title.trim().toLowerCase()));
  return templateItems(listKey).filter((item) => !have.has(item.title.toLowerCase()));
}

/** A whole-wedding summary: how much of every started list is packed. */
export function packingSummary(items = []) {
  return PACKING_LISTS.map((list) => ({
    key: list.key,
    label: list.label,
    ...listProgress(items, list.key),
  }));
}

/** Unpacked first, then packed, each in the order they were added. */
export function sortForDisplay(items = []) {
  return [...items].sort((a, b) => Number(a.packed) - Number(b.packed));
}

export function packingText(items = [], listKey) {
  const list = listByKey(listKey);
  const lines = [list ? list.label : 'Packing list', ''];
  for (const item of itemsFor(items, listKey)) lines.push(`${item.packed ? '[x]' : '[ ]'} ${item.title}`);
  return lines.join('\n');
}
