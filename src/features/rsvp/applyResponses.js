import { EventAttendance, PlusOneStatus, RsvpStatus } from '@/models';

/**
 * Copy guests' RSVP replies into the guest list (slice E1b).
 *
 * A reply arrives as a synced `rsvpResponses` record. Each submission is
 * applied once per phone (tracked by `submittedAt`): if the couple later
 * changes a guest by hand, that change stands until the guest submits again.
 * The guest updates then sync to the partner like any other edit.
 *
 * A guest invited to several events answers each one (slice F1); those
 * answers go onto the events' `attendance`, which the event counts read.
 */

/**
 * The guest patches for replies not yet applied, oldest submission first, so
 * a newer reply for the same guest wins.
 * Returns `{ updates: [{ guestId, patch }], attendance: { [eventId]: { [guestId]: status } },
 * applied: [{ id, submittedAt }] }`.
 */
export function planResponseUpdates({ responses = [], applied = {}, guestsById = {} }) {
  const pending = responses
    .filter((response) => response?.submittedAt && applied[response.id] !== response.submittedAt)
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

  const patches = new Map();
  const attendance = {};
  for (const response of pending) {
    for (const answer of response.guests ?? []) {
      const guest = guestsById[answer.guestId];
      if (!guest) continue;
      for (const [eventId, going] of Object.entries(answer.events ?? {})) {
        attendance[eventId] = {
          ...(attendance[eventId] ?? {}),
          [answer.guestId]: going ? EventAttendance.ATTENDING : EventAttendance.DECLINED,
        };
      }
      const patch = {
        rsvpStatus: answer.attending ? RsvpStatus.ATTENDING : RsvpStatus.DECLINED,
        rsvpRespondedAt: response.submittedAt,
      };
      if (answer.attending && answer.meal) patch.mealPreference = answer.meal;
      if (answer.attending && answer.dietary) patch.dietaryNotes = answer.dietary;
      if (answer.attending && answer.plusOneName) {
        patch.plusOneName = answer.plusOneName;
        patch.plusOneStatus = PlusOneStatus.CONFIRMED;
      }
      patches.set(answer.guestId, { ...(patches.get(answer.guestId) ?? {}), ...patch });
    }
  }

  return {
    updates: [...patches].map(([guestId, patch]) => ({ guestId, patch })),
    attendance,
    applied: pending.map((response) => ({ id: response.id, submittedAt: response.submittedAt })),
  };
}

/** Apply pending replies to the stores. Returns how many guests changed. */
export function applyPendingResponses({ rsvpStore, guestStore, eventStore = null }) {
  const { responses, applied, markApplied } = rsvpStore.getState();
  const list = responses.allIds.map((id) => responses.byId[id]).filter(Boolean);
  const { guests, updateGuest } = guestStore.getState();
  const plan = planResponseUpdates({ responses: list, applied, guestsById: guests.byId });
  for (const { guestId, patch } of plan.updates) updateGuest(guestId, patch);
  if (eventStore) eventStore.getState().applyAttendance(plan.attendance);
  markApplied(plan.applied);
  return plan.updates.length;
}

/**
 * Apply replies now, and again whenever new ones arrive. Replies arrive in a
 * pull, which runs with change tracking paused; applying is deferred until it
 * finishes so the guest edits are queued and reach the partner.
 * Returns an unsubscribe function.
 */
export function watchRsvpResponses({
  rsvpStore,
  guestStore,
  eventStore = null,
  defer = (fn) => setTimeout(fn, 0),
}) {
  const apply = () => applyPendingResponses({ rsvpStore, guestStore, eventStore });
  apply();
  let last = rsvpStore.getState().responses;
  return rsvpStore.subscribe((state) => {
    if (state.responses === last) return;
    last = state.responses;
    defer(apply);
  });
}
