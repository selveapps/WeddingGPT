export const GUEST_RSVP_FIELD = 'profileGuestRsvps';
export const RSVP_STATUSES = ['yes', 'no', 'pending'];

export function validateGuestRsvp(values = {}) {
  const errors = {};
  const name = typeof values.name === 'string' ? values.name.trim() : '';
  const partySize = Number(values.partySize);
  if (!name) errors.name = 'Add a guest name.';
  else if (name.length > 80) errors.name = 'Keep the name under 80 characters.';
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 30) {
    errors.partySize = 'Party size must be between 1 and 30.';
  }
  if (!RSVP_STATUSES.includes(values.rsvp)) errors.rsvp = 'Choose an RSVP status.';
  if (String(values.meal ?? '').length > 80) errors.meal = 'Keep the meal preference under 80 characters.';
  if (String(values.notes ?? '').length > 300) errors.notes = 'Keep notes under 300 characters.';
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function normaliseGuestRsvp(values = {}) {
  return {
    name: values.name.trim(),
    rsvp: RSVP_STATUSES.includes(values.rsvp) ? values.rsvp : 'pending',
    partySize: Number(values.partySize),
    meal: String(values.meal ?? '').trim(),
    notes: String(values.notes ?? '').trim(),
  };
}

export function filterGuestRsvps(records = [], status = 'all', query = '') {
  const term = String(query).trim().toLocaleLowerCase();
  return records.filter((guest) => {
    const statusMatch = status === 'all' || guest.rsvp === status;
    const textMatch =
      !term ||
      [guest.name, guest.meal, guest.notes].some((text) =>
        String(text ?? '')
          .toLocaleLowerCase()
          .includes(term)
      );
    return statusMatch && textMatch;
  });
}

export function summariseGuestRsvps(records = []) {
  return records.reduce(
    (summary, guest) => {
      summary[guest.rsvp] = (summary[guest.rsvp] || 0) + Number(guest.partySize || 0);
      summary.guests += 1;
      return summary;
    },
    { yes: 0, no: 0, pending: 0, guests: 0 }
  );
}
