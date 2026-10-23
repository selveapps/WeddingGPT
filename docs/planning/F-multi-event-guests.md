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

## F3 — Day-of sheet for vendors

A couple sends a vendor a link to one event's page: when and where, the run of
show, and the people to call. It is public in the sense that anyone with the
link can read it, like an RSVP link, so it has its own threats.

| # | Threat | Control | Test |
| --- | --- | --- | --- |
| D1 | Guessing links | 128-bit random token, stored only as a SHA-256 hash, returned once; page loads rate-limited per address | Made-up, malformed and over-long tokens all get the same 404; the token is never in a listing |
| D2 | The page shows more than a vendor needs | Only the event (name, date, times, place, address, dress code), its run of show, the couple's names, and the wedding-party contacts the couple ticked (name, role, phone) | No guests, costs, emails, other events' schedules or unticked contacts on the page |
| D3 | Stored XSS through the couple's text | The same escaping template as the RSVP pages; CSP with no script; `tel:` links keep only digits and `+` | An event named `<script>` renders as text |
| D4 | Leaks through indexing, caching or the Referer header | `noindex`, `no-store`, `no-referrer`, `X-Frame-Options: DENY` - the RSVP pages' headers | Headers present |
| D5 | A link outlives its use or is forwarded | Revocable at any time; shows when it was last opened; stops a week after the event (or 120 days without a date); stops when its event is deleted | Revoked, expired and orphaned links stop working |
| D6 | Reaching another wedding's data | Making, listing and revoking need membership of the wedding (404 otherwise); a sheet reads only its own wedding's records; an event or contact id from another wedding shows nothing | Outsiders get 404; foreign ids are ignored |

Status: F3 done on `feature/vendor-day-sheet`. Links are made from the run of
show of the wedding day or an event, once the wedding is synced (the page is
served from the account's copy, so it changes with the plan). Limits: 50 live
links per wedding, 10 contacts per link.

