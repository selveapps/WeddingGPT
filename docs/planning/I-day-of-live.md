# I — The day itself

The run of show plans the day minute by minute, but on the day it was still
a list to read: nothing said what was happening now, and the people to call
were on other screens. I makes the run of show something to run the day
from.

## Slices

| Slice | What | New LOC (est.) |
| --- | --- | ---: |
| I1 Live mode | Now / next with a countdown, "running late", one-tap calls | 300–450 |

## I1 — Live mode

On the date of the day being viewed (the event's date, or the wedding date
for the wedding day), the run of show opens with a live card:

- **Now:** each item in progress, until when, where and who runs it. An item
  with no duration is "now" for its starting minute. Items in progress also
  get a *Now* badge in the list.
- **Next / First up:** the next item, its time and how long until it starts.
- **Running late?** +5m, +10m, +15m move the next item and everything after
  it, with the same undo as the list's +15m. Not offered before the day has
  started, when there is nothing to be late for.
- **Who to call today:** everyone found for the day's owners, once each,
  with the items they run. Now and Next have their own *Call* button.
- When everything is over: "That was everything on the day."

The card keeps its own clock and moves on every 30 seconds.

**Matching owners to people.** Owners are free text. In order:
1. a vendor or vendor contact whose name is in the owner ("Saffron Kitchen
   team"), or a party member's name ("Asha");
2. a vendor in the category the owner describes ("Caterer", "DJ",
   "Photographer", "Pandit"), booked first;
3. a party member in the role it describes ("Ushers", "Best man").

Only people with a phone number count; declined and passed vendors never
do. Names match whole words, so "Dev" does not match "Development".

**Acceptance.** On any other day there is no live card. Before the first
item it counts down to it without late buttons. Calling opens the phone's
dialler with the number's digits.

**Not in this slice:** a notification as each item starts, and live mode on
the vendor's shared day-of page (it would need the server to know the time
zone of the wedding).

Status: I1 done on `feature/day-of-live-mode`. Jest fakes the clock; needs a
check on a real phone on a day with a run of show.
