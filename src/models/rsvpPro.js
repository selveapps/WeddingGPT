/**
 * RSVP & Plus-One Hub – richer responses, meal choices, reminders.
 */
import { createEntity } from './base';

export const RsvpStatus = {
  PENDING: 'pending', YES: 'yes', NO: 'no', MAYBE: 'maybe',
};

export const RsvpStatusMeta = {
  pending: { label: 'Awaiting', tone: 'neutral' },
  yes: { label: 'Attending', tone: 'success' },
  no: { label: 'Declined', tone: 'danger' },
  maybe: { label: 'Maybe', tone: 'warning' },
};

export function createRsvpCampaign(partial = {}) {
  return createEntity({
    weddingId: null, title: 'Main RSVP', deadline: null,
    allowPlusOnes: true, allowMealChoice: true, allowSongRequest: false,
    customQuestions: [], isOpen: true, ...partial,
  });
}

export function createRsvpResponse(partial = {}) {
  return createEntity({
    weddingId: null, campaignId: null, guestId: null, status: RsvpStatus.PENDING,
    plusOnes: [], mealChoice: null, dietaryNotes: '', songRequest: '',
    customAnswers: {}, respondedAt: null, reminderCount: 0, ...partial,
  });
}

export function createRsvpReminder(partial = {}) {
  return createEntity({
    weddingId: null, campaignId: null, channel: 'email', // email | sms | both
    scheduledAt: null, sentAt: null, templateKey: 'gentle', ...partial,
  });
}

export function deriveRsvpStats(responses) {
  const list = Array.isArray(responses) ? responses : Object.values(responses?.byId || {});
  const by = { pending: 0, yes: 0, no: 0, maybe: 0 };
  let plusOneCount = 0;
  for (const r of list) {
    by[r.status] = (by[r.status] || 0) + 1;
    plusOneCount += (r.plusOnes || []).length;
  }
  return { total: list.length, ...by, plusOneCount, responseRate: list.length ? (list.length - by.pending) / list.length : 0 };
}
