# H — Vendor appointments and payments

Playbook workstream B lists "appointment history" for vendors. Vendors had
one `meetingAt` date and a payment plan nobody was reminded about. H makes
both something the app keeps track of.

## Slices

| Slice | What | New LOC (est.) |
| --- | --- | ---: |
| H1 Appointments | Tastings, fittings, visits and calls per vendor, what was decided, a reminder the evening before | 500–700 |
| H2 Payment reminders | "Deposit due in 3 days" for booked vendors' payment plans | 100–200 |

## H1 — Appointments

Each vendor keeps `appointments: [{ id, kind, date, time, place, notes,
outcome }]` alongside its payments, so they sync with the vendor
(`models/appointments.js`). Kinds: meeting, call, site visit, tasting,
fitting, trial run, other. `time` is a clock or null; an appointment without
a date is one still to be booked.

- **Vendor screen:** an *Appointments* section, upcoming first, then past
  ones newest first with what was decided. Tap one to edit; once it is past
  the sheet asks *What was decided*.
- **Vendors list:** *Coming up* shows the next three across all vendors.
- **Reminder:** 6pm the evening before (`vendor_appointment`, its own switch,
  on by default). Two on one day fold into one.

**The old meeting date.** No migration: `vendorAppointments` reads a
vendor's `meetingAt` as its first appointment (id `appt_meeting`), which also
covers a vendor synced from a phone that has not updated. Any change writes
the list and clears `meetingAt`, so the meeting is never doubled or brought
back after a delete. The vendor form no longer has *Meeting date*, and no
longer writes `appointments` or `meetingAt`, so saving it cannot undo a
change synced in the meantime.

**Acceptance.** Add, edit and delete with undo; an unreadable time or a time
without a date is refused; past and undated appointments are not reminded;
an old meeting date shows, reminds, and stays deleted once deleted.

Status: H1 done on `feature/vendor-appointments`.
