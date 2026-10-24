export function venueProfileFromWedding(wedding) {
  const details = wedding?.venueDetails ?? {};
  return {
    venueName: String(wedding?.venueName ?? ''),
    address: String(details.address ?? ''),
    contactName: String(details.contactName ?? ''),
    contactPhone: String(details.contactPhone ?? ''),
    guestCapacity:
      details.guestCapacity === null || details.guestCapacity === undefined
        ? ''
        : String(details.guestCapacity),
    accessNotes: String(details.accessNotes ?? ''),
    restrictions: String(details.restrictions ?? ''),
    contingencyPlan: String(details.contingencyPlan ?? ''),
  };
}

export function validateVenueProfile(values) {
  const errors = {};
  const capacity = String(values.guestCapacity ?? '').trim();

  if (capacity && (!/^\d+$/.test(capacity) || Number(capacity) < 1 || Number(capacity) > 100000)) {
    errors.guestCapacity = 'Enter a whole-number capacity between 1 and 100,000.';
  }

  const phone = String(values.contactPhone ?? '').trim();
  if (phone && !/^[+()\d.\-\s]{7,30}$/.test(phone)) {
    errors.contactPhone = 'Enter a valid phone number.';
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}

export function assessVenueReadiness(values, estimatedGuests = null) {
  const requiredDetails = [
    ['venueName', 'Venue name'],
    ['address', 'Venue address'],
    ['contactName', 'Venue contact'],
    ['contactPhone', 'Venue phone'],
    ['guestCapacity', 'Guest capacity'],
    ['contingencyPlan', 'Weather or backup plan'],
  ];
  const missing = requiredDetails
    .filter(([key]) => !String(values?.[key] ?? '').trim())
    .map(([, label]) => label);
  const capacity = Number(values?.guestCapacity);
  const guestCount = Number(estimatedGuests);
  const capacityExceeded =
    Number.isFinite(capacity) && capacity > 0 && Number.isFinite(guestCount) && guestCount > capacity;

  return {
    complete: missing.length === 0,
    missing,
    capacityExceeded,
    capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : null,
    estimatedGuests: Number.isFinite(guestCount) && guestCount > 0 ? guestCount : null,
  };
}

export function venueProfileShareText(values) {
  const fields = [
    ['Venue', values.venueName],
    ['Address', values.address],
    ['Contact', values.contactName],
    ['Phone', values.contactPhone],
    ['Guest capacity', values.guestCapacity],
    ['Access and setup', values.accessNotes],
    ['Rules and restrictions', values.restrictions],
    ['Weather or backup plan', values.contingencyPlan],
  ].filter(([, value]) => String(value ?? '').trim());

  return ['VENUE BRIEF', ...fields.map(([label, value]) => `${label}: ${String(value).trim()}`)].join('\n');
}

export function buildVenueProfilePatch(values) {
  const capacity = String(values.guestCapacity ?? '').trim();
  return {
    venueName: String(values.venueName ?? '').trim(),
    venueDetails: {
      address: String(values.address ?? '').trim(),
      contactName: String(values.contactName ?? '').trim(),
      contactPhone: String(values.contactPhone ?? '').trim(),
      guestCapacity: capacity ? Number(capacity) : null,
      accessNotes: String(values.accessNotes ?? '').trim(),
      restrictions: String(values.restrictions ?? '').trim(),
      contingencyPlan: String(values.contingencyPlan ?? '').trim(),
    },
  };
}
