# C — Planning and finance

Workstream C of the playbook (§6C): multiple events, task dependencies,
reusable templates, and planned-versus-actual budget reports. No new public
surface or account data, so it needs no threat model; it does need acceptance
criteria per slice (playbook §7), which are below.

## Why

Many weddings are several events: a mehndi on Friday, the ceremony and
reception on Saturday, a brunch on Sunday. Today the app has one date, one
place and one guest list, so couples keep the rest in their heads or a
spreadsheet. The other slices build on events: tasks and costs belong to an
event, and a template is a checklist for one.

## Slices

| Slice | What | New LOC (est.) |
| --- | --- | ---: |
| C1 Events | Events with their own date, times, place, dress code and guest list; tasks and expenses can belong to one; the wedding website schedule can be filled from them | 1,800–2,500 |
| C2 Task dependencies | "Send invitations" waits for "Finalise the guest list"; blocked tasks are marked and skipped by the daily checklist | 800–1,200 |
| C3 Templates | Checklists per kind of event (mehndi, sangeet, rehearsal dinner...) offered when the event is added; a plan can be saved and reused | 800–1,200 |
| C4 Finance reports | Planned vs actual by category and by event, payments due by month, CSV export | 1,200–1,800 |
| **Total** | | **4,600–6,700** |

## Data (C1)

`events` is a new synced collection, one record per event:

```text
{ id, weddingId, name, kind, date, startTime, endTime, venueName, address,
  dressCode, notes, guestScope: 'everyone' | 'invited', invitedGuestIds: [], order }
```

- `kind` is a preset (ceremony, reception, mehndi, sangeet, haldi, rehearsal
  dinner, welcome party, brunch, other) used for icons, names and, in C3,
  templates.
- The guest list lives on the event (`invitedGuestIds`), not on each guest,
  so inviting 200 people to the reception is one record change, and editing a
  guest never conflicts with editing an event.
- Tasks and expenses gain an optional `eventId`. Existing records have none and
  mean "the wedding as a whole".
- The wedding's own date stays the main date (countdown, plan generation).
  Events are additional detail, never a second source of the wedding date.

Out of scope for C1: per-event RSVP on the guest site (a guest still answers
once for the wedding). It needs a change to the RSVP form and server, and is
noted as a follow-up.

## Acceptance criteria

**C1 Events**

- Planning > Events lists events by date, then order; add, edit, reorder and
  delete (with confirmation; tasks and expenses of a deleted event go back to
  "the wedding as a whole", they are not deleted).
- Each event: name, kind, date, start and end time, place and address, dress
  code, notes, and either everyone or a chosen guest list, with counts of
  invited and attending guests.
- A task and an expense can be assigned to an event; Planning and Budget can
  filter by event.
- The wedding website editor offers "Use my events" to fill its schedule.
- Events sync between partners; a deleted guest leaves every event's list.
- Tests for the model, store, sync slice and screens; a live sync test.

**C2 Task dependencies** — a task can wait for others; completing is allowed
but the task shows what it waits for; cycles are refused; the daily checklist
skips tasks still waiting; plan generation adds the obvious dependencies.

**C3 Templates** — adding an event of a known kind offers its checklist,
dated from the event; the couple picks which tasks to add; nothing is added
without confirming.

**C4 Finance reports** — planned (category allocations) against committed and
paid, by category and by event; payments due per month for the next twelve
months; overspends highlighted; CSV export of the report.
