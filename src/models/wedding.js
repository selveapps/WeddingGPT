import { createEntity } from './base';
import { DateType, CeremonyType, PlanningStage } from './enums';
import { DEFAULT_CURRENCY } from '../lib/currency';

/**
 * User, Couple and Wedding - the root of the workspace.
 *
 * `Wedding` intentionally holds the *summary* of date, location and budget
 * rather than only foreign keys. The PRD models WeddingDate and WeddingLocation
 * as separate entities (s.21), and those exist below for the sync-ready shape,
 * but Home reads the countdown and city on every launch; denormalising the few
 * fields it needs avoids three lookups to render the first screen.
 */

export function createUser({ name = '', email = null, phone = null, avatarUrl = null } = {}) {
  return createEntity('user', {
    name,
    email,
    phone,
    avatarUrl,
    /** Set once the account is backed by a real auth provider. */
    authProviderId: null,
    lastActiveAt: new Date().toISOString(),
  });
}

export function createCouple({
  userId = null,
  partnerName = '',
  partnerEmail = null,
  partnerUserId = null,
  collaborationEnabled = false,
} = {}) {
  return createEntity('couple', {
    userIds: [userId, partnerUserId].filter(Boolean),
    primaryUserId: userId,
    partnerUserId,
    partnerName,
    partnerEmail,
    collaborationEnabled,
    /** Set when an invite is sent, cleared when the partner accepts. */
    partnerInviteSentAt: null,
  });
}

export function createWeddingDate({ weddingId, date = null, dateType = DateType.UNDECIDED } = {}) {
  return createEntity('wdate', { weddingId, date, dateType });
}

export function createWeddingLocation({
  weddingId,
  city = '',
  region = '',
  country = '',
  venueName = null,
} = {}) {
  return createEntity('wloc', { weddingId, city, region, country, venueName });
}

export function createWedding({
  coupleId = null,
  ownerName = '',
  partnerName = '',
  date = null,
  dateType = DateType.UNDECIDED,
  city = '',
  region = '',
  country = '',
  guestCountEstimate = null,
  budgetTotal = null,
  currency = DEFAULT_CURRENCY,
  planningStage = PlanningStage.JUST_ENGAGED,
  ceremonyType = CeremonyType.UNDECIDED,
  styleTags = [],
  stressors = [],
} = {}) {
  return createEntity('wedding', {
    coupleId,

    // Denormalised for the dashboard - see the note at the top of this file.
    ownerName,
    partnerName,
    date,
    dateType,
    city,
    region,
    country,

    guestCountEstimate,
    budgetTotal,
    currency,

    planningStage,
    ceremonyType,
    styleTags,
    /** What the couple said they were most worried about, from onboarding. */
    stressors,

    /** Filled by `generatePersonalisedPlan` after onboarding. */
    planGeneratedAt: null,
  });
}

/** A couple's display name for greetings: "Asha and Rahul". */
export function coupleDisplayName(wedding) {
  const a = wedding?.ownerName?.trim();
  const b = wedding?.partnerName?.trim();
  if (a && b) return `${a} and ${b}`;
  return a || b || 'your wedding';
}

/**
 * Whether we know the date precisely enough to run a day-level countdown.
 * A month- or season-level answer still gives us a horizon, but the UI must
 * say "around September 2027" rather than an exact figure it cannot support.
 */
export function hasExactDate(wedding) {
  return wedding?.dateType === DateType.EXACT && Boolean(wedding?.date);
}
