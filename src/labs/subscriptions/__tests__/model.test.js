import { EntitlementStatus, SubscriptionPlan } from '@/models';

import {
  FREE_GUEST_LIMIT,
  PremiumFeature,
  TRIAL_DAYS,
  canUse,
  cancelRenewal,
  effectiveEntitlement,
  isPlus,
  perMonthLabel,
  purchase,
  savingsPercent,
  startTrial,
  statusLine,
} from '../model';

const NOW = new Date('2027-01-10T12:00:00Z');
const later = (days) => new Date(NOW.getTime() + days * 86400000);

describe('pricing', () => {
  it('works out the yearly saving and monthly equivalent', () => {
    expect(savingsPercent(SubscriptionPlan.ANNUAL)).toBe(50);
    expect(savingsPercent(SubscriptionPlan.MONTHLY)).toBe(0);
    expect(perMonthLabel(SubscriptionPlan.ANNUAL)).toBe('$5.00/mo');
  });
});

describe('trial', () => {
  it('lasts seven days, then expires', () => {
    const { entitlement } = startTrial({ now: NOW });
    expect(entitlement.status).toBe(EntitlementStatus.TRIAL);
    expect(isPlus(entitlement, later(TRIAL_DAYS - 1))).toBe(true);
    expect(isPlus(entitlement, later(TRIAL_DAYS + 1))).toBe(false);
    expect(effectiveEntitlement(entitlement, later(30)).status).toBe(EntitlementStatus.EXPIRED);
  });

  it('can only be used once', () => {
    expect(startTrial({ now: NOW, trialUsed: true }).error).toMatch(/already/);
  });
});

describe('purchase and renewal', () => {
  it('renews automatically until cancelled', () => {
    const { entitlement } = purchase(SubscriptionPlan.MONTHLY, { now: NOW });
    expect(isPlus(entitlement, later(100))).toBe(true);
    expect(new Date(effectiveEntitlement(entitlement, later(100)).expiresAt) > later(100)).toBe(true);
  });

  it('keeps access after cancelling until the period ends', () => {
    const cancelled = cancelRenewal(purchase(SubscriptionPlan.MONTHLY, { now: NOW }).entitlement);
    expect(isPlus(cancelled, later(20))).toBe(true);
    expect(isPlus(cancelled, later(40))).toBe(false);
  });

  it('rejects unknown plans', () => {
    expect(purchase('lifetime').error).toBeDefined();
  });
});

describe('canUse', () => {
  it('locks Plus features on the free plan and opens them with Plus', () => {
    expect(canUse(PremiumFeature.PARTNER_SYNC, null, { now: NOW })).toBe(false);
    expect(canUse('checklist', null, { now: NOW })).toBe(true);
    const plus = purchase(SubscriptionPlan.ANNUAL, { now: NOW }).entitlement;
    expect(canUse(PremiumFeature.PARTNER_SYNC, plus, { now: NOW })).toBe(true);
  });

  it('applies the free guest limit', () => {
    expect(canUse(PremiumFeature.UNLIMITED_GUESTS, null, { guestCount: FREE_GUEST_LIMIT - 1 })).toBe(true);
    expect(canUse(PremiumFeature.UNLIMITED_GUESTS, null, { guestCount: FREE_GUEST_LIMIT })).toBe(false);
  });
});

it('describes the current status', () => {
  expect(statusLine(null, NOW)).toBe('Free plan');
  expect(statusLine(startTrial({ now: NOW }).entitlement, later(2))).toBe('Free trial - 5 days left');
  const yearly = purchase(SubscriptionPlan.ANNUAL, { now: NOW }).entitlement;
  expect(statusLine(yearly, NOW)).toMatch(/^Plus yearly - renews Jan 10, 2028$/);
  expect(statusLine(cancelRenewal(yearly), NOW)).toMatch(/^Plus - ends/);
});
