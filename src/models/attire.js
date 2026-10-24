/**
 * Outfit & Attire Planner – full model.
 * Roles, items, fittings, accessories, palettes, looks, vendors, pack lists.
 */
import { createEntity } from './base';

export const AttireRole = {
  BRIDE: 'bride', GROOM: 'groom', PARTNER_A: 'partner_a', PARTNER_B: 'partner_b',
  BRIDESMAID: 'bridesmaid', GROOMSMAN: 'groomsman', FLOWER_GIRL: 'flower_girl',
  RING_BEARER: 'ring_bearer', MOTHER: 'mother', FATHER: 'father',
  JUNIOR_ATTENDANT: 'junior_attendant', OFFICIANT: 'officiant', OTHER: 'other',
};

export const AttireRoleMeta = {
  bride: { label: 'Bride', emoji: '👰', group: 'couple' },
  groom: { label: 'Groom', emoji: '🤵', group: 'couple' },
  partner_a: { label: 'Partner A', emoji: '💑', group: 'couple' },
  partner_b: { label: 'Partner B', emoji: '💑', group: 'couple' },
  bridesmaid: { label: 'Bridesmaid / Attendant', emoji: '👗', group: 'party' },
  groomsman: { label: 'Groomsman / Attendant', emoji: '👔', group: 'party' },
  flower_girl: { label: 'Flower Girl', emoji: '🌸', group: 'party' },
  ring_bearer: { label: 'Ring Bearer', emoji: '💍', group: 'party' },
  junior_attendant: { label: 'Junior Attendant', emoji: '🎀', group: 'party' },
  mother: { label: 'Mother / Parent', emoji: '👗', group: 'family' },
  father: { label: 'Father / Parent', emoji: '🤵', group: 'family' },
  officiant: { label: 'Officiant', emoji: '🎤', group: 'other' },
  other: { label: 'Other', emoji: '✨', group: 'other' },
};

export const GarmentType = {
  DRESS: 'dress', SUIT: 'suit', TUXEDO: 'tuxedo', JUMPSUIT: 'jumpsuit',
  SEPARATES: 'separates', SHERWANI: 'sherwani', LEHENGA: 'lehenga',
  KIMONO: 'kimono', SHOES: 'shoes', VEIL: 'veil', JACKET: 'jacket', OTHER: 'other',
};

export const GarmentTypeMeta = {
  dress: { label: 'Dress' }, suit: { label: 'Suit' }, tuxedo: { label: 'Tuxedo' },
  jumpsuit: { label: 'Jumpsuit' }, separates: { label: 'Separates' },
  sherwani: { label: 'Sherwani' }, lehenga: { label: 'Lehenga' },
  kimono: { label: 'Kimono' }, shoes: { label: 'Shoes' }, veil: { label: 'Veil' },
  jacket: { label: 'Jacket' }, other: { label: 'Other' },
};

export const AttireStatus = {
  IDEA: 'idea', RESEARCHING: 'researching', ORDERED: 'ordered',
  RECEIVED: 'received', FITTING: 'fitting', ALTERATIONS: 'alterations',
  READY: 'ready', PACKED: 'packed',
};

export const AttireStatusMeta = {
  idea: { label: 'Idea', tone: 'neutral', order: 10 },
  researching: { label: 'Researching', tone: 'info', order: 20 },
  ordered: { label: 'Ordered', tone: 'info', order: 30 },
  received: { label: 'Received', tone: 'info', order: 40 },
  fitting: { label: 'In fittings', tone: 'warning', order: 50 },
  alterations: { label: 'Alterations', tone: 'warning', order: 60 },
  ready: { label: 'Ready', tone: 'success', order: 70 },
  packed: { label: 'Packed', tone: 'success', order: 80 },
};

export const FittingStatus = {
  NOT_SCHEDULED: 'not_scheduled', SCHEDULED: 'scheduled', COMPLETED: 'completed',
  ALTERATIONS: 'alterations', FINAL: 'final', CANCELLED: 'cancelled',
};

export const FittingStatusMeta = {
  not_scheduled: { label: 'Not scheduled', tone: 'neutral' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  alterations: { label: 'Alterations needed', tone: 'warning' },
  final: { label: 'Final fitting', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

export const AccessoryCategory = {
  JEWELRY: 'jewelry', SHOES: 'shoes', VEIL: 'veil', CUFFLINKS: 'cufflinks',
  BELT: 'belt', TIE: 'tie', CLUTCH: 'clutch', HAIR: 'hair', LINGERIE: 'lingerie',
  SOMETHING_BLUE: 'something_blue', OTHER: 'other',
};

export const AccessoryCategoryMeta = {
  jewelry: { label: 'Jewelry', emoji: '💎' },
  shoes: { label: 'Shoes', emoji: '👠' },
  veil: { label: 'Veil / Headpiece', emoji: '👰' },
  cufflinks: { label: 'Cufflinks', emoji: '🔗' },
  belt: { label: 'Belt / Sash', emoji: '🎗️' },
  tie: { label: 'Tie / Bow tie', emoji: '🎀' },
  clutch: { label: 'Clutch / Bag', emoji: '👜' },
  hair: { label: 'Hair accessory', emoji: '💇' },
  lingerie: { label: 'Shapewear / Lingerie', emoji: '✨' },
  something_blue: { label: 'Something blue', emoji: '💙' },
  other: { label: 'Other', emoji: '📎' },
};

export function createAttireItem(partial = {}) {
  return createEntity({
    weddingId: null, role: AttireRole.OTHER, garmentType: GarmentType.OTHER,
    wearerGuestId: null, wearerName: '', title: '', description: '',
    color: '', colorHex: null, brand: '', retailer: '', size: '',
    sizeNotes: '', purchaseUrl: null, rental: false, rentalReturnDate: null,
    cost: 0, currency: 'USD', depositPaid: 0, photoUris: [], notes: '',
    status: AttireStatus.IDEA, isPrimary: true, occasion: 'ceremony', // ceremony | reception | both | other
    vendorId: null, vendorName: '', orderDate: null, expectedDate: null,
    ...partial,
  });
}

export function createFitting(partial = {}) {
  return createEntity({
    weddingId: null, attireItemId: null, status: FittingStatus.NOT_SCHEDULED,
    scheduledAt: null, location: '', tailorName: '', phone: '',
    notes: '', completedAt: null, cost: 0, currency: 'USD',
    ...partial,
  });
}

export function createAccessory(partial = {}) {
  return createEntity({
    weddingId: null, attireItemId: null, name: '',
    category: AccessoryCategory.OTHER, color: '', colorHex: null,
    cost: 0, currency: 'USD', notes: '', isPacked: false, isMustHave: true,
    photoUri: null, ...partial,
  });
}

export function createColorPalette(partial = {}) {
  return createEntity({
    weddingId: null, name: 'Wedding Palette',
    colors: [], // [{ id, name, hex, role? }]
    notes: '', isPrimary: true, ...partial,
  });
}

export function createLookBoard(partial = {}) {
  return createEntity({
    weddingId: null, title: 'Party look', role: AttireRole.BRIDESMAID,
    attireItemIds: [], notes: '', inspirationUris: [], ...partial,
  });
}

export function createAttireVendor(partial = {}) {
  return createEntity({
    weddingId: null, name: '', type: 'boutique', // boutique | tailor | rental | online
    phone: '', email: '', address: '', website: '', notes: '', ...partial,
  });
}

export function createPackListItem(partial = {}) {
  return createEntity({
    weddingId: null, attireItemId: null, accessoryId: null,
    label: '', isPacked: false, packedAt: null, sortOrder: 0, ...partial,
  });
}

// --- helpers ---
export function attireForRole(items, role) {
  const list = Array.isArray(items) ? items : Object.values(items?.byId || {});
  return list.filter((i) => i.role === role);
}

export function groupAttireByRole(items) {
  const list = Array.isArray(items) ? items : Object.values(items?.byId || {});
  const groups = {};
  for (const item of list) {
    const r = item.role || AttireRole.OTHER;
    if (!groups[r]) groups[r] = [];
    groups[r].push(item);
  }
  return groups;
}

export function fittingsForItem(itemId, fittings) {
  const list = Array.isArray(fittings) ? fittings : Object.values(fittings?.byId || {});
  return list.filter((f) => f.attireItemId === itemId)
    .sort((a, b) => (a.scheduledAt || '').localeCompare(b.scheduledAt || ''));
}

export function accessoriesForItem(itemId, accessories) {
  const list = Array.isArray(accessories) ? accessories : Object.values(accessories?.byId || {});
  return list.filter((a) => a.attireItemId === itemId);
}

export function nextFitting(fittings) {
  const list = Array.isArray(fittings) ? fittings : Object.values(fittings?.byId || {});
  const upcoming = list
    .filter((f) => f.status === FittingStatus.SCHEDULED && f.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  return upcoming[0] || null;
}

export function deriveAttireStats(items, fittings, accessories) {
  const i = Array.isArray(items) ? items : Object.values(items?.byId || {});
  const f = Array.isArray(fittings) ? fittings : Object.values(fittings?.byId || {});
  const a = Array.isArray(accessories) ? accessories : Object.values(accessories?.byId || {});
  const ready = i.filter((x) => x.status === AttireStatus.READY || x.status === AttireStatus.PACKED);
  const packed = i.filter((x) => x.status === AttireStatus.PACKED);
  return {
    itemCount: i.length,
    readyCount: ready.length,
    packedCount: packed.length,
    readyRatio: i.length ? ready.length / i.length : 0,
    fittingsScheduled: f.filter((x) => x.status === FittingStatus.SCHEDULED).length,
    fittingsCompleted: f.filter((x) =>
      x.status === FittingStatus.COMPLETED || x.status === FittingStatus.FINAL).length,
    accessoryCount: a.length,
    accessoriesPacked: a.filter((x) => x.isPacked).length,
    totalCost: i.reduce((s, x) => s + (x.cost || 0), 0) + a.reduce((s, x) => s + (x.cost || 0), 0)
      + f.reduce((s, x) => s + (x.cost || 0), 0),
    rentalCount: i.filter((x) => x.rental).length,
  };
}

export function statusRank(status) {
  return AttireStatusMeta[status]?.order ?? 0;
}

export function canTransition(from, to) {
  const order = statusRank(from);
  const next = statusRank(to);
  if (from === to) return true;
  // allow forward or one step back
  return next >= order - 15;
}
