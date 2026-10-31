# G — Tools for each event

Workstreams C and F made a wedding several events with their own guests,
answers, tables and day-of pages. G follows that through to the practical
tools couples hand to other people.

## Slices

| Slice | What | New LOC (est.) |
| --- | --- | ---: |
| G1 Meals per event | The caterer's numbers, allergy list and CSV for one event | 150–300 |
| G2 Reminders per event | "The mehndi is in 3 days" and "send the caterer final numbers" timed from each event's date | 300–500 |
| G3 Printable plan | One page per event - schedule, place, seating, contacts - to print or save as PDF | 500–800 |

## G1 — Meals per event

An event's plates are its invited guests who are attending it: their answer
for that event first (F1), then their reply for the wedding as a whole. A
guest who declined the wedding but said yes to one event is a plate there;
one who said no to this event is not, even if coming to the rest.

**Acceptance.** Meals has event chips; numbers, allergies, the summary and the
CSV (named after the event) follow the chosen event; nothing changes for a
wedding without events.

Status: G1 done on `feature/meals-per-event`.

## G2 — Reminders per event

Each dated event schedules, in the existing on-device reminder service:

- **3 days before, 9am** — "Mehndi is in 3 days", with the time, place and
  dress code; opens the event.
- **7 days before, 9am** — "Final numbers for the Mehndi": that event's plates
  (G1's count, plus-ones included) and how many invited guests have still to
  answer; opens Meals on that event. Skipped when nobody is invited.

Two new reminder types, `event_soon` and `caterer_numbers`, each with a switch
in reminder settings, on by default (saved preferences without them read as
on). Two events landing on the same reminder day fold into one notification,
and both rank just below milestones when a day is over the three-reminder cap.

**Acceptance.** Undated and past events schedule nothing; a declined answer
for the event is not a plate; turning a type off removes it; the reminder's
link opens Meals on that event.

Status: G2 done on `feature/event-reminders`.
