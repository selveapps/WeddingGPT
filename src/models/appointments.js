import { createId } from '../lib/id';
import { clockFromInput } from './events';
import { fromClock, formatTime } from '../lib/time';
import { fromISODate, todayISO } from '../lib/date';

/**
 * Vendor appointments (slice H1): the cake tasting, the second dress
 * fitting, the venue walk-through, the hair trial. Each vendor keeps a list,
 * like its payments: `{ id, kind, date, time, place, notes, outcome }`, with
 * `time` a "16:30" clock or null and `outcome` what was decided, written
 * afterwards.
 *
 * Vendors saved before H1 have a single `meetingAt` date. It reads as the
 * first appointment (id LEGACY_MEETING_ID), so nothing is lost and no
 * migration is needed - including for a vendor synced from a phone that has
 * not updated yet. Editing or deleting it writes it into the list and clears
 * `meetingAt`.
 */

export const AppointmentKind = {
  MEETING: 'meeting',
  CALL: 'call',
  SITE_VISIT: 'site_visit',
  TASTING: 'tasting',
  FITTING: 'fitting',
  TRIAL: 'trial',
  OTHER: 'other',
};

export const APPOINTMENT_KIND_META = {
  [AppointmentKind.MEETING]: { label: 'Meeting' },
  [AppointmentKind.CALL]: { label: 'Call' },
  [AppointmentKind.SITE_VISIT]: { label: 'Site visit' },
  [AppointmentKind.TASTING]: { label: 'Tasting' },
  [AppointmentKind.FITTING]: { label: 'Fitting' },
  [AppointmentKind.TRIAL]: { label: 'Trial run' },
  [AppointmentKind.OTHER]: { label: 'Appointment' },
};

export const APPOINTMENT_LIMITS = {
  perVendor: 30,
  textChars: 500,
};

export const LEGACY_MEETING_ID = 'appt_meeting';

export const appointmentLabel = (appointment) =>
  APPOINTMENT_KIND_META[appointment?.kind]?.label ?? APPOINTMENT_KIND_META[AppointmentKind.OTHER].label;

export function createAppointment({
  kind = AppointmentKind.MEETING,
  date = null,
  time = null,
  place = '',
  notes = '',
  outcome = '',
} = {}) {
  return {
    id: createId('appt'),
    kind: APPOINTMENT_KIND_META[kind] ? kind : AppointmentKind.OTHER,
    date,
    time,
    place: place.trim(),
    notes: notes.trim(),
    outcome: outcome.trim(),
  };
}

/** A vendor's appointments, the pre-H1 meeting date included, soonest first. */
export function vendorAppointments(vendor) {
  const list = Array.isArray(vendor?.appointments) ? vendor.appointments : [];
  const legacy =
    vendor?.meetingAt && !list.some((appointment) => appointment.id === LEGACY_MEETING_ID)
      ? [
          {
            id: LEGACY_MEETING_ID,
            kind: AppointmentKind.MEETING,
            date: vendor.meetingAt,
            time: null,
            place: '',
            notes: '',
            outcome: '',
          },
        ]
      : [];
  return sortAppointments([...list, ...legacy]);
}

export function sortAppointments(appointments = []) {
  return [...appointments].sort((a, b) => {
    if (a.date !== b.date) {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    }
    return (fromClock(a.time) ?? -1) - (fromClock(b.time) ?? -1);
  });
}

/** Today's or later; an undated appointment is still to be booked, so it counts as upcoming. */
export const isUpcoming = (appointment, today = todayISO()) => !appointment.date || appointment.date >= today;

/** "Sat, Mar 6 at 11:00 AM", "Sat, Mar 6", or "" - `formatDate` is the caller's date format. */
export function appointmentWhen(appointment, formatDate) {
  if (!appointment?.date) return '';
  const minutes = fromClock(appointment.time);
  return minutes === null
    ? formatDate(appointment.date)
    : `${formatDate(appointment.date)} at ${formatTime(minutes)}`;
}

/**
 * The next appointments across all vendors, soonest first: rows of the
 * appointment plus `vendorId`, `vendorName` and a stable `key`. Undated ones
 * are left out - there is nothing to be on time for yet.
 */
export function upcomingAppointments(vendors = [], { today = todayISO(), limit = 5 } = {}) {
  const rows = [];
  for (const vendor of vendors) {
    for (const appointment of vendorAppointments(vendor)) {
      if (!appointment.date || appointment.date < today) continue;
      rows.push({
        ...appointment,
        key: `${vendor.id}:${appointment.id}`,
        vendorId: vendor.id,
        vendorName: vendor.name,
      });
    }
  }
  return sortAppointments(rows).slice(0, limit);
}

/**
 * Check what the form typed. `timeText` is what the couple wrote ("11am");
 * returns `{ errors, fields }` with the time stored as a clock.
 */
export function validateAppointment({
  kind,
  date,
  timeText = '',
  place = '',
  notes = '',
  outcome = '',
} = {}) {
  const errors = {};
  if (date && !fromISODate(date)) errors.date = 'Pick a valid date.';
  const time = clockFromInput(timeText);
  if (String(timeText).trim() && time === null) errors.time = 'Try a time like 11am or 14:30.';
  if (String(timeText).trim() && !date) errors.date = 'Add the date too.';
  for (const [key, value] of Object.entries({ place, notes, outcome })) {
    if (value.length > APPOINTMENT_LIMITS.textChars) errors[key] = 'That is too long.';
  }
  return {
    errors,
    fields: {
      kind,
      date: date || null,
      time,
      place: place.trim(),
      notes: notes.trim(),
      outcome: outcome.trim(),
    },
  };
}

// Each change returns the vendor patch to save. Any change moves the pre-H1
// meeting into the list and clears `meetingAt`, so the meeting is never shown
// twice or brought back after being deleted.
const patch = (appointments) => ({ appointments: sortAppointments(appointments), meetingAt: null });

/** Null when the vendor already has APPOINTMENT_LIMITS.perVendor. */
export function addAppointment(vendor, fields) {
  const current = vendorAppointments(vendor);
  if (current.length >= APPOINTMENT_LIMITS.perVendor) return null;
  return patch([...current, createAppointment(fields)]);
}

export function updateAppointment(vendor, appointmentId, fields) {
  return patch(
    vendorAppointments(vendor).map((appointment) =>
      appointment.id === appointmentId ? { ...appointment, ...fields, id: appointment.id } : appointment
    )
  );
}

export function removeAppointment(vendor, appointmentId) {
  return patch(vendorAppointments(vendor).filter((appointment) => appointment.id !== appointmentId));
}
