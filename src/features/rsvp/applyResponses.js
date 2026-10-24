import { RsvpStatus } from '@/models/enums';

const GUEST_RSVP_STATUS = {
  attending: RsvpStatus.ATTENDING,
  yes: RsvpStatus.ATTENDING,
  declined: RsvpStatus.DECLINED,
  no: RsvpStatus.DECLINED,
  maybe: RsvpStatus.MAYBE,
  pending: RsvpStatus.PENDING,
  no_response: RsvpStatus.NO_RESPONSE,
};

export function watchRsvpResponses({ rsvpStore, guestStore }) {
  let processing = false;

  const applyResponses = () => {
    if (processing) return;
    processing = true;

    try {
      const { responses, applied } = rsvpStore.getState();
      const guestState = guestStore.getState();
      const appliedEntries = [];

      for (const id of responses.allIds) {
        const response = responses.byId[id];
        const submittedAt = response.respondedAt || response.submittedAt;
        const rsvpStatus = GUEST_RSVP_STATUS[response.status];
        const guest = guestState.guests.byId[response.guestId];

        if (!submittedAt || applied[id] === submittedAt || !rsvpStatus || !guest) continue;

        const updated = guestStore.getState().updateGuest(response.guestId, {
          rsvpStatus,
          rsvpRespondedAt: submittedAt,
        });
        if (updated) appliedEntries.push({ id, submittedAt });
      }

      rsvpStore.getState().markApplied(appliedEntries);
    } finally {
      processing = false;
    }
  };

  const unsubscribeResponses = rsvpStore.subscribe(applyResponses);
  const unsubscribeGuests = guestStore.subscribe(applyResponses);
  applyResponses();

  return () => {
    unsubscribeResponses();
    unsubscribeGuests();
  };
}
