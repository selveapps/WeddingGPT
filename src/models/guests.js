import { createEntity } from './base';
import {
  RsvpStatus,
  InvitationStatus,
  PlusOneStatus,
  MealPreference,
  RSVP_STATUS_META,
} from './enums';

/**
 * Guests, households, RSVPs and meal preferences.
 *
 * RSVP and meal preference are modelled as fields on the guest rather than as
 * separate records, despite the PRD listing them as entities (s.21). The
 * relationship is strictly 1:1 and every screen that shows a guest also shows
 * their RSVP; splitting them would mean a join on every list render for no
 * gain. `rsvpRespondedAt` preserves the one piece of data the separate entity
 * carried that the status alone does not.
 *
 * Households exist because invitations go to households, not people - and
 * "how many invitations do we still need to send" is a question the couple
 * actually asks.
 */

export function createHousehold({ weddingId, name, address = '', notes = '' } = {}) {
  return createEntity('hh', {
    weddingId,
    name,
    address,
    notes,
    invitationStatus: InvitationStatus.NOT_SENT,
    invitationSentAt: null,
  });
}

export function createGuest({
  weddingId,
  householdId = null,
  firstName = '',
  lastName = '',
  email = null,
  phone = null,
  rsvpStatus = RsvpStatus.PENDING,
  invitationStatus = InvitationStatus.NOT_SENT,
  plusOneStatus = PlusOneStatus.NOT_ALLOWED,
  plusOneName = '',
  mealPreference = MealPreference.UNSPECIFIED,
  dietaryNotes = '',
  tags = [],
  notes = '',
  isChild = false,
} = {}) {
  return createEntity('guest', {
    weddingId,
    householdId,
    firstName,
    lastName,
    email,
    phone,
    rsvpStatus,
    rsvpRespondedAt: null,
    invitationStatus,
    plusOneStatus,
    plusOneName,
    mealPreference,
    dietaryNotes,
    tags,
    notes,
    isChild,
  });
}

export function guestFullName(guest) {
  return [guest?.firstName, guest?.lastName].filter(Boolean).join(' ').trim();
}

/**
 * RSVP counts for the dashboard snapshot.
 *
 * `attendingHeadcount` counts confirmed plus-ones as real people, because that
 * is the number the caterer needs - while `attending` counts invited guests,
 * which is the number the couple thinks in. Both are shown, labelled clearly.
 */
export function summariseRsvps(guests = []) {
  const counts = {
    total: guests.length,
    attending: 0,
    declined: 0,
    pending: 0,
    maybe: 0,
    noResponse: 0,
    plusOnesConfirmed: 0,
    children: 0,
  };

  for (const guest of guests) {
    switch (guest.rsvpStatus) {
      case RsvpStatus.ATTENDING:
        counts.attending++;
        break;
      case RsvpStatus.DECLINED:
        counts.declined++;
        break;
      case RsvpStatus.MAYBE:
        counts.maybe++;
        break;
      case RsvpStatus.NO_RESPONSE:
        counts.noResponse++;
        break;
      default:
        counts.pending++;
    }

    if (guest.plusOneStatus === PlusOneStatus.CONFIRMED) counts.plusOnesConfirmed++;
    if (guest.isChild) counts.children++;
  }

  const responded = counts.attending + counts.declined + counts.maybe;

  return {
    ...counts,
    responded,
    awaiting: counts.total - responded,
    attendingHeadcount: counts.attending + counts.plusOnesConfirmed,
    /** 0-1. Drives the RSVP progress bar on Home. */
    responseRate: counts.total > 0 ? responded / counts.total : 0,
  };
}

/** Meal-preference tallies for the caterer, excluding anyone not attending. */
export function summariseMeals(guests = []) {
  const tally = {};
  for (const guest of guests) {
    if (guest.rsvpStatus !== RsvpStatus.ATTENDING) continue;
    const key = guest.mealPreference ?? MealPreference.UNSPECIFIED;
    tally[key] = (tally[key] ?? 0) + 1;
  }
  return tally;
}

/** Does this RSVP status mean the guest is coming? Reads off the enum metadata. */
export function countsAsAttending(rsvpStatus) {
  return Boolean(RSVP_STATUS_META[rsvpStatus]?.countsAsAttending);
}

/** Group guests under their household, with loose guests in a null bucket. */
export function groupByHousehold(guests = [], households = []) {
  const byId = new Map(households.map((h) => [h.id, { household: h, guests: [] }]));
  const ungrouped = [];

  for (const guest of guests) {
    const entry = guest.householdId ? byId.get(guest.householdId) : null;
    if (entry) entry.guests.push(guest);
    else ungrouped.push(guest);
  }

  return { grouped: [...byId.values()], ungrouped };
}
