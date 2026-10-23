# F — Guests across several events

Workstream C gave a wedding several events, each with its own guest list.
Guests, though, still answer once for the whole wedding, and the seating chart
and day-of plans assume one room and one day. This workstream follows the
guest through each event.

## Slices

| Slice | What | New LOC (est.) |
| --- | --- | ---: |
| F1 RSVP per event | A guest invited to several events answers each one on the RSVP page; the couple's event counts use those answers | 600–900 |
| F2 Seating per event | Each event can have its own tables (the mehndi is not the reception) | 500–800 |
| F3 Day-of sheet for vendors | A read-only, revocable link with one event's run of show, address and contacts, for a vendor | 700–1,000 |

## F1 — RSVP per event

**Data.** A reply's answer for each guest gains `events: { [eventId]: true | false }`
for the events that guest is invited to. `attending` stays, and means "coming
to at least one". Each event gains `attendance: { [guestId]: 'attending' | 'declined' }`,
written by the couple's app when it applies replies, never by the server.

**Form.** A guest invited to two or more events sees one yes/no per event,
with the event's name, date, time and place. A guest invited to one event,
or a wedding without events, sees the single question as today. The couple can
switch per-event questions off (`questions.events`).

**Counts.** An event's attending and declined counts use the per-event
answer when there is one, and the guest's wedding-wide reply otherwise.

**Threats (from design E).**
- W2: an invite sees only the events at least one of its own guests is
  invited to, and only their name, date, time and place. Answers for events a
  guest is not invited to are ignored.
- W3: event names and places are the couple's text, escaped like every other
  value on the page.
- W10: the server writes only the `rsvpResponses` record; event records are
  changed only by the couple's app.

**Acceptance.** Per-event questions appear only for multi-event guests;
missing answers are refused; another event's id in the form changes nothing;
replies update each event's counts in the app; a guest removed from an event
after replying no longer counts there; tests on the server, the app and a live
sync scenario.

Status: F1 done on `feature/rsvp-per-event`.

F2 done on `feature/seating-per-event`: tables carry `eventId`; an event's
seatable guests are its invited guests who have not declined it; deleting an
event deletes its tables; deleted guests' seats are freed by the guest store
at deletion (the seating screen no longer compares lists, which could empty
every table during a workspace switch).
