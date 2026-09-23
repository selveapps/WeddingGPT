import { createEntity } from './base';
import { EntitlementStatus, ENTITLEMENT_STATUS_META } from './enums';

/**
 * Subscription entitlement and notification preferences.
 *
 * Entitlement is deliberately a record with an expiry rather than a boolean.
 * `isPremium` is computed from status *and* date, so an expired subscription
 * cannot leave a stale `true` behind if an expiry job never runs - which, on a
 * device that has been offline for a month, it will not have.
 */

export function createEntitlement({
  userId = null,
  status = EntitlementStatus.FREE,
  plan = null,
  startedAt = null,
  expiresAt = null,
  productId = null,
  store = null,
} = {}) {
  return createEntity('ent', {
    userId,
    status,
    plan,
    startedAt,
    expiresAt,
    productId,
    store,
    lastVerifiedAt: null,
  });
}

/**
 * Whether premium features should currently be unlocked.
 * Grace period counts as premium: the subscription is in a billing retry, and
 * locking someone out mid-planning over a card that expired is hostile.
 */
export function isPremiumActive(entitlement, now = new Date()) {
  if (!entitlement) return false;

  const meta = ENTITLEMENT_STATUS_META[entitlement.status];
  if (!meta?.isPremium) return false;

  if (entitlement.expiresAt) {
    const expiry = new Date(entitlement.expiresAt);
    if (!Number.isNaN(expiry.getTime()) && expiry <= now) return false;
  }

  return true;
}

export const NotificationType = {
  TASK_DUE: 'task_due',
  TASK_OVERDUE: 'task_overdue',
  PAYMENT_DUE: 'payment_due',
  RSVP_ACTIVITY: 'rsvp_activity',
  WEEKLY_DIGEST: 'weekly_digest',
  MILESTONES: 'milestones',
  PARTNER_ACTIVITY: 'partner_activity',
  PRODUCT_NEWS: 'product_news',
};

export const NOTIFICATION_TYPE_META = {
  [NotificationType.TASK_DUE]: {
    label: 'Upcoming tasks',
    description: 'A nudge a few days before something is due.',
    defaultEnabled: true,
  },
  [NotificationType.TASK_OVERDUE]: {
    label: 'Overdue tasks',
    description: 'Only when something has actually slipped.',
    defaultEnabled: true,
  },
  [NotificationType.PAYMENT_DUE]: {
    label: 'Payments due',
    description: 'Vendor balances and deposit deadlines.',
    defaultEnabled: true,
  },
  [NotificationType.RSVP_ACTIVITY]: {
    label: 'RSVP activity',
    description: 'When guests reply.',
    defaultEnabled: true,
  },
  [NotificationType.WEEKLY_DIGEST]: {
    label: 'Weekly summary',
    description: 'One calm catch-up each week.',
    defaultEnabled: true,
  },
  [NotificationType.MILESTONES]: {
    label: 'Milestones',
    description: 'Countdown moments worth marking.',
    defaultEnabled: true,
  },
  [NotificationType.PARTNER_ACTIVITY]: {
    label: 'Partner updates',
    description: 'When your partner completes something.',
    defaultEnabled: true,
  },
  [NotificationType.PRODUCT_NEWS]: {
    label: 'Product news',
    description: 'Occasional updates about WeddingGPT.',
    defaultEnabled: false,
  },
};

export function createNotificationPreferences({ userId = null } = {}) {
  const types = {};
  for (const [key, meta] of Object.entries(NOTIFICATION_TYPE_META)) {
    types[key] = meta.defaultEnabled;
  }

  return createEntity('npref', {
    userId,
    types,
    /** Master switch, independent of the per-type toggles. */
    enabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });
}

/** Default user preferences, held as a plain object rather than an entity. */
export function createUserPreferences() {
  return {
    themePreference: 'system',
    hapticsEnabled: true,
    analyticsEnabled: true,
    currency: null, // falls back to the wedding's currency
    hasSeenPaywall: false,
    lastPaywallShownAt: null,
  };
}
