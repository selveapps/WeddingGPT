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

## G3 — Printable plan

One page per event, or for the wedding day: date, time, place and dress code;
guests attending of invited and plates (G1's count); that event's run of
show; allergies to check; its seating chart; booked vendors and wedding-party
members with a phone or email; and the event's notes.

`models/eventPlan.js` builds the plan and lays it out as text and as a
standalone HTML page (everything the couple typed is escaped). In a browser
*Print or save as PDF* sends the page to the print dialog; on a phone *Share
the plan* sends the text to the share sheet, since printing there needs a
native module (`expo-print`) and a new build. Charts over 30 tables are cut
with a count.

Reached from Planning (*Printable plan*) and from each event.

**Acceptance.** Each event shows only its own schedule, tables and guests;
the wedding day shows the day's; empty sections are left out; a day with
nothing in it says so and links to the run of show.

Status: G3 done on `feature/printable-event-plan`.
