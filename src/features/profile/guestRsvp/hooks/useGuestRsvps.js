import { useProfileCollection } from '../../hooks/useProfileCollection';
import { GUEST_RSVP_FIELD } from '../lib/guestRsvpHelpers';

export function useGuestRsvps() {
  return useProfileCollection(GUEST_RSVP_FIELD);
}

export default useGuestRsvps;
