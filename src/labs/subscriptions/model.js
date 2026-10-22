import {
  EntitlementStatus,
  ENTITLEMENT_STATUS_META,
  SubscriptionPlan,
  createEntitlement,
  isPremiumActive,
  touchEntity,
} from '@/models';
import { formatMoney } from '@/lib/currency';
import { formatMediumDate, toISODate } from '@/lib/date';

/**
 * Subscriptions (Labs) - Phase 6 groundwork.
 *
 * Plans, the free-versus-Plus feature split, trial and renewal rules, and the
 * single `canUse(feature)` gate the app would call. Purchases here are
 * simulated against the existing Entitlement model; a real store
 * (RevenueCat, StoreKit, Play Billing) would replace `purchase` and
 * `startTrial`, and nothing that calls `canUse` would change.
 *
 * Prices are placeholders for testing the paywall, not a pricing decision.
 */

export const TRIAL_DAYS = 7;

export const PLANS = [
  {
    key: SubscriptionPlan.ANNUAL,
    label: 'Yearly',
    price: 5999,
    months: 12,
    productId: 'weddinggpt.plus.annual',
  },
  {
    key: SubscriptionPlan.MONTHLY,
    label: 'Monthly',
    price: 999,
    months: 1,
    productId: 'weddinggpt.plus.monthly',
  },
];

export const PremiumFeature = {
  PARTNER_SYNC: 'partner_sync',
  CLAUDE_ASSISTANT: 'claude_assistant',
  SEATING_CHART: 'seating_chart',
  QUOTE_READER: 'quote_reader',
  UNLIMITED_GUESTS: 'unlimited_guests',
};

/** What each tier gets. `free: null` means Plus only. */
export const FEATURE_TABLE = [
  { key: 'checklist', label: 'Personal checklist and budget', free: 'Included', plus: 'Included' },
  { key: PremiumFeature.UNLIMITED_GUESTS, label: 'Guest list', free: 'Up to 150 guests', plus: 'Unlimited' },
  { key: 'assistant_local', label: 'On-device assistant', free: 'Included', plus: 'Included' },
  { key: PremiumFeature.CLAUDE_ASSISTANT, label: 'Claude-powered assistant', free: null, plus: 'Included' },
  { key: PremiumFeature.PARTNER_SYNC, label: 'Plan together with your partner', free: null, plus: 'Included' },
  { key: PremiumFeature.SEATING_CHART, label: 'Seating chart', free: null, plus: 'Included' },
  { key: PremiumFeature.QUOTE_READER, label: 'Quote and contract reader', free: null, plus: 'Included' },
];

export const FREE_GUEST_LIMIT = 150;

export function planByKey(key) {
  return PLANS.find((plan) => plan.key === key) ?? null;
}

/** Whole-percent saving of a plan against paying monthly for the same time. */
export function savingsPercent(planKey) {
  const plan = planByKey(planKey);
  const monthly = planByKey(SubscriptionPlan.MONTHLY);
  if (!plan || !monthly || plan.months <= 1) return 0;
  const full = monthly.price * plan.months;
  return Math.round(((full - plan.price) / full) * 100);
}

export function perMonthLabel(planKey) {
  const plan = planByKey(planKey);
  return plan ? `${formatMoney(Math.round(plan.price / plan.months), undefined, { showDecimals: true })}/mo` : '';
}

function addMonthsTo(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function startTrial({ now = new Date(), trialUsed = false } = {}) {
  if (trialUsed) return { error: 'The free trial has already been used on this device.' };
  return {
    entitlement: createEntitlement({
      status: EntitlementStatus.TRIAL,
      startedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + TRIAL_DAYS * 86400000).toISOString(),
      store: 'test',
    }),
  };
}

export function purchase(planKey, { now = new Date() } = {}) {
  const plan = planByKey(planKey);
  if (!plan) return { error: 'Unknown plan.' };
  return {
    entitlement: {
      ...createEntitlement({
        status: EntitlementStatus.ACTIVE,
        plan: plan.key,
        startedAt: now.toISOString(),
        expiresAt: addMonthsTo(now, plan.months).toISOString(),
        productId: plan.productId,
        store: 'test',
      }),
      willRenew: true,
    },
  };
}

/** Cancelling stops renewal; access continues until the period ends. */
export function cancelRenewal(entitlement) {
  if (entitlement?.status !== EntitlementStatus.ACTIVE) return entitlement;
  return touchEntity(entitlement, { willRenew: false });
}

/**
 * The status as of `now`. A lapsed trial or a cancelled plan past its end
 * becomes expired; a renewing plan past its end rolls forward (the store would
 * have charged).
 */
export function effectiveEntitlement(entitlement, now = new Date()) {
  if (!entitlement?.expiresAt) return entitlement ?? null;
  const expires = new Date(entitlement.expiresAt);
  if (expires > now) return entitlement;

  if (entitlement.status === EntitlementStatus.ACTIVE && entitlement.willRenew) {
    const plan = planByKey(entitlement.plan);
    let next = expires;
    while (plan && next <= now) next = addMonthsTo(next, plan.months);
    return { ...entitlement, expiresAt: next.toISOString() };
  }
  if (entitlement.status === EntitlementStatus.TRIAL || entitlement.status === EntitlementStatus.ACTIVE) {
    return { ...entitlement, status: EntitlementStatus.EXPIRED };
  }
  return entitlement;
}

export function isPlus(entitlement, now = new Date()) {
  return isPremiumActive(effectiveEntitlement(entitlement, now), now);
}

/** The one gate. `context.guestCount` feeds the free guest limit. */
export function canUse(feature, entitlement, { now = new Date(), guestCount = 0 } = {}) {
  if (isPlus(entitlement, now)) return true;
  if (feature === PremiumFeature.UNLIMITED_GUESTS) return guestCount < FREE_GUEST_LIMIT;
  const row = FEATURE_TABLE.find((entry) => entry.key === feature);
  return Boolean(row?.free);
}

export function daysLeft(entitlement, now = new Date()) {
  if (!entitlement?.expiresAt) return null;
  return Math.max(0, Math.ceil((new Date(entitlement.expiresAt) - now) / 86400000));
}

export function statusLine(entitlement, now = new Date()) {
  const current = effectiveEntitlement(entitlement, now);
  if (!current || current.status === EntitlementStatus.FREE) return 'Free plan';
  const label = ENTITLEMENT_STATUS_META[current.status]?.label ?? current.status;
  const end = current.expiresAt ? formatMediumDate(toISODate(new Date(current.expiresAt))) : '';

  if (current.status === EntitlementStatus.TRIAL) {
    const left = daysLeft(current, now);
    return `Free trial - ${left} day${left === 1 ? '' : 's'} left`;
  }
  if (current.status === EntitlementStatus.ACTIVE) {
    const plan = planByKey(current.plan)?.label ?? '';
    return current.willRenew ? `Plus ${plan.toLowerCase()} - renews ${end}` : `Plus - ends ${end}`;
  }
  return label;
}
