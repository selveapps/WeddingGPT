/**
 * Gift Registry Advanced model.
 * Multi-retailer registries, cash funds, thank-you tracking, purchase status.
 */
import { createEntity } from './base';

export const RegistryProvider = {
  AMAZON: 'amazon', TARGET: 'target', CRATE: 'crate_and_barrel',
  POTTERY_BARN: 'pottery_barn', WILLIAMS: 'williams_sonoma',
  ZOLA: 'zola', THE_KNOT: 'the_knot', CUSTOM: 'custom', CASH: 'cash_fund',
};

export const RegistryProviderMeta = {
  amazon: { label: 'Amazon', emoji: '📦' },
  target: { label: 'Target', emoji: '🎯' },
  crate_and_barrel: { label: 'Crate & Barrel', emoji: '🏠' },
  pottery_barn: { label: 'Pottery Barn', emoji: '🛋️' },
  williams_sonoma: { label: 'Williams Sonoma', emoji: '🍳' },
  zola: { label: 'Zola', emoji: '💍' },
  the_knot: { label: 'The Knot', emoji: '🪢' },
  custom: { label: 'Custom / Other', emoji: '✨' },
  cash_fund: { label: 'Cash / Honeymoon Fund', emoji: '💸' },
};

export const ItemStatus = {
  WANTED: 'wanted', PURCHASED: 'purchased', THANKED: 'thanked',
  RETURNED: 'returned', REMOVED: 'removed',
};

export const ItemStatusMeta = {
  wanted: { label: 'Still wanted', tone: 'info' },
  purchased: { label: 'Purchased', tone: 'success' },
  thanked: { label: 'Thanked', tone: 'success' },
  returned: { label: 'Returned', tone: 'warning' },
  removed: { label: 'Removed', tone: 'neutral' },
};

export function createRegistry(partial = {}) {
  return createEntity({
    weddingId: null, provider: RegistryProvider.CUSTOM, title: '',
    url: null, isPrimary: false, notes: '', itemCount: 0, purchasedCount: 0, ...partial,
  });
}

export function createRegistryItem(partial = {}) {
  return createEntity({
    weddingId: null, registryId: null, title: '', description: '',
    url: null, imageUrl: null, price: 0, currency: 'USD', quantity: 1,
    quantityPurchased: 0, status: ItemStatus.WANTED, priority: 2,
    category: 'home', thankYouSent: false, purchaserName: '', purchaserGuestId: null, ...partial,
  });
}

export function createCashFund(partial = {}) {
  return createEntity({
    weddingId: null, title: 'Honeymoon Fund', goalAmount: 0, raisedAmount: 0,
    currency: 'USD', url: null, notes: '', isPublic: true, ...partial,
  });
}

export function createThankYouNote(partial = {}) {
  return createEntity({
    weddingId: null, guestId: null, registryItemId: null, body: '',
    sentAt: null, method: 'card', // card | email | text
    ...partial,
  });
}

export function itemsRemaining(items) {
  const list = Array.isArray(items) ? items : Object.values(items?.byId || {});
  return list.filter((i) => i.status === ItemStatus.WANTED || (i.quantityPurchased || 0) < (i.quantity || 1));
}

export function deriveRegistryStats(registries, items, funds) {
  const r = Array.isArray(registries) ? registries : Object.values(registries?.byId || {});
  const i = Array.isArray(items) ? items : Object.values(items?.byId || {});
  const f = Array.isArray(funds) ? funds : Object.values(funds?.byId || {});
  const purchased = i.filter((x) => x.status === ItemStatus.PURCHASED || x.status === ItemStatus.THANKED);
  const thanked = i.filter((x) => x.thankYouSent || x.status === ItemStatus.THANKED);
  return {
    registryCount: r.length,
    itemCount: i.length,
    purchasedCount: purchased.length,
    thankYouPending: purchased.length - thanked.length,
    fundCount: f.length,
    fundRaised: f.reduce((s, x) => s + (x.raisedAmount || 0), 0),
    fundGoal: f.reduce((s, x) => s + (x.goalAmount || 0), 0),
  };
}
