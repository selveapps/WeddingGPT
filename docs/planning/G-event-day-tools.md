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
