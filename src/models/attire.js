/**
 * Outfit & Attire Planner.
 *
 * Couple outfits, wedding party looks, color palette coordination,
 * fittings, and accessories checklists.
 */

import { createEntity } from './base';

export const AttireRole = {
  BRIDE: 'bride',
  GROOM: 'groom',
  PARTNER_A: 'partner_a',
  PARTNER_B: 'partner_b',
  BRIDESMAID: 'bridesmaid',
  GROOMSMAN: 'groomsman',
  FLOWER_GIRL: 'flower_girl',
  RING_BEARER: 'ring_bearer',
  MOTHER: 'mother',
  FATHER: 'father',
  OTHER: 'other',
};

export const AttireRoleMeta = {
  [AttireRole.BRIDE]: { label: 'Bride', emoji: '👰' },
  [AttireRole.GROOM]: { label: 'Groom', emoji: '🤵' },
  [AttireRole.PARTNER_A]: { label: 'Partner A', emoji: '💑' },
  [AttireRole.PARTNER_B]: { label: 'Partner B', emoji: '💑' },
  [AttireRole.BRIDESMAID]: { label: 'Bridesmaid / Attendant', emoji: '👗' },
  [AttireRole.GROOMSMAN]: { label: 'Groomsman / Attendant', emoji: '👔' },
  [AttireRole.FLOWER_GIRL]: { label: 'Flower Girl', emoji: '🌸' },
  [AttireRole.RING_BEARER]: { label: 'Ring Bearer', emoji: '💍' },
  [AttireRole.MOTHER]: { label: 'Mother / Parent', emoji: '👗' },
  [AttireRole.FATHER]: { label: 'Father / Parent', emoji: '🤵' },
  [AttireRole.OTHER]: { label: 'Other', emoji: '✨' },
};

export const FittingStatus = {
  NOT_SCHEDULED: 'not_scheduled',
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  ALTERATIONS: 'alterations',
  FINAL: 'final',
};

export function createAttireItem(partial = {}) {
  return createEntity({
    weddingId: null,
    role: AttireRole.OTHER,
    wearerGuestId: null,
    wearerName: '',
    title: '', // e.g. "Ceremony dress", "Reception suit"
    description: '',
    color: '',
    colorHex: null,
    brand: '',
    size: '',
    purchaseUrl: null,
    rental: false,
    cost: 0,
    currency: 'USD',
    photoUris: [],
    notes: '',
    isPrimary: true,
    ...partial,
  });
}

export function createFitting(partial = {}) {
  return createEntity({
    weddingId: null,
    attireItemId: null,
    status: FittingStatus.NOT_SCHEDULED,
    scheduledAt: null,
    location: '',
    notes: '',
    completedAt: null,
    ...partial,
  });
}

export function createAccessory(partial = {}) {
  return createEntity({
    weddingId: null,
    attireItemId: null,
    name: '',
    category: 'jewelry', // jewelry | shoes | veil | cufflinks | other
    notes: '',
    isPacked: false,
    ...partial,
  });
}

export function createColorPalette(partial = {}) {
  return createEntity({
    weddingId: null,
    name: 'Wedding Palette',
    colors: [], // [{ name, hex }]
    notes: '',
    isPrimary: true,
    ...partial,
  });
}

export function attireForRole(items, role) {
  const list = Array.isArray(items) ? items : Object.values(items?.byId || {});
  return list.filter((i) => i.role === role);
}

export function deriveAttireStats(items, fittings) {
  const i = Array.isArray(items) ? items : Object.values(items?.byId || {});
  const f = Array.isArray(fittings) ? fittings : Object.values(fittings?.byId || {});
  return {
    itemCount: i.length,
    totalCost: i.reduce((s, x) => s + (x.cost || 0), 0),
    fittingsScheduled: f.filter((x) => x.status === FittingStatus.SCHEDULED).length,
    fittingsCompleted: f.filter(
      (x) => x.status === FittingStatus.COMPLETED || x.status === FittingStatus.FINAL
    ).length,
  };
}
