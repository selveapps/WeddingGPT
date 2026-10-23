import { createTask } from './planning';
import { EventKind } from './events';
import { TaskPriority } from './enums';
import { addDays, daysUntil, toISODate } from '../lib/date';

/**
 * Checklists for each kind of event (workstream C, slice C3).
 *
 * When a couple adds a mehndi, the app offers the things a mehndi needs - a
 * henna artist, the music, the colours - dated back from the event. Nothing is
 * added until they pick what they want and confirm.
 *
 * The main plan (`planGeneration.js`) already covers the ceremony and the
 * reception as the wedding itself, so their lists here are the extras that
 * only matter once they are separate events: their own timings, their own
 * vendors, their own rooms.
 *
 * Each entry: a stable `key` (so the app knows what was already added),
 * `daysBefore` the event, a plan category, and optionally `waitsFor` keys in
 * the same list (slice C2 links).
 */

const HIGH = TaskPriority.HIGH;

export const EVENT_CHECKLISTS = {
  [EventKind.MEHNDI]: [
    {
      key: 'artist',
      title: 'Book the henna artist',
      description:
        'Good artists book out months ahead in wedding season. Ask how many guests they can do per hour.',
      daysBefore: 120,
      categoryKey: 'vendors',
      priority: HIGH,
    },
    {
      key: 'design',
      title: 'Choose the bridal henna design',
      description: 'Collect a few references; the artist will adapt them. Decide whether to hide the names.',
      daysBefore: 45,
      categoryKey: 'attire',
      waitsFor: ['artist'],
    },
    {
      key: 'guest_henna',
      title: 'Decide who gets henna and how much',
      description:
        'Bride only, close family, or every guest who wants it - it sets how many artists you need.',
      daysBefore: 60,
      categoryKey: 'guests',
      waitsFor: ['artist'],
    },
    {
      key: 'music',
      title: 'Plan the mehndi music',
      description: 'A dholki, a playlist or a DJ. Ask the aunties who is leading the songs.',
      daysBefore: 45,
      categoryKey: 'vendors',
    },
    {
      key: 'seating',
      title: 'Arrange low seating and cushions',
      description: 'Henna takes hours and needs to dry; people need somewhere comfortable to sit still.',
      daysBefore: 21,
      categoryKey: 'details',
    },
    {
      key: 'food',
      title: 'Sort food that can be eaten without hands',
      description: 'Someone will be feeding the bride. Plan small bites and straws.',
      daysBefore: 21,
      categoryKey: 'vendors',
    },
    {
      key: 'outfit',
      title: 'Pick the mehndi outfit',
      description: 'Usually green or bright; something you do not mind getting henna on.',
      daysBefore: 60,
      categoryKey: 'attire',
    },
    {
      key: 'aftercare',
      title: 'Prepare henna aftercare',
      description: 'Lemon and sugar, a lot of tissues, and a plan to keep it on overnight.',
      daysBefore: 3,
      categoryKey: 'week_of',
    },
  ],

  [EventKind.SANGEET]: [
    {
      key: 'venue',
      title: 'Book the sangeet venue',
      description: 'A dance floor, a stage and a sound system matter more than the view.',
      daysBefore: 150,
      categoryKey: 'venue',
      priority: HIGH,
    },
    {
      key: 'dj',
      title: 'Book a DJ or band',
      description: 'Share the performance list early so they can load the tracks.',
      daysBefore: 120,
      categoryKey: 'vendors',
      waitsFor: ['venue'],
    },
    {
      key: 'performers',
      title: 'Ask family and friends to perform',
      description: 'Each side usually does a few dances. Give people time to rehearse.',
      daysBefore: 90,
      categoryKey: 'guests',
    },
    {
      key: 'choreographer',
      title: 'Decide on a choreographer',
      description: 'Optional, but it turns six awkward rehearsals into two fun ones.',
      daysBefore: 75,
      categoryKey: 'vendors',
    },
    {
      key: 'running_order',
      title: 'Write the performance running order',
      description: 'Who goes when, how long each is, and who introduces them.',
      daysBefore: 21,
      categoryKey: 'foundations',
      waitsFor: ['performers'],
    },
    {
      key: 'music_files',
      title: 'Send every track to the DJ',
      description: 'Edited and in order, with a backup on a USB stick.',
      daysBefore: 10,
      categoryKey: 'vendors',
      waitsFor: ['dj', 'running_order'],
    },
    {
      key: 'outfit',
      title: 'Pick the sangeet outfit',
      description: 'Something you can actually dance in.',
      daysBefore: 60,
      categoryKey: 'attire',
    },
  ],

  [EventKind.HALDI]: [
    {
      key: 'location',
      title: 'Choose where the haldi happens',
      description: 'Outdoors or somewhere that can be hosed down. Turmeric stains everything.',
      daysBefore: 60,
      categoryKey: 'venue',
    },
    {
      key: 'paste',
      title: 'Arrange the haldi paste',
      description: 'Ready-made or a family recipe - decide who is making it and when.',
      daysBefore: 7,
      categoryKey: 'details',
    },
    {
      key: 'clothes',
      title: 'Pick clothes you can ruin',
      description: 'Yellow and old. The same goes for anyone close enough to join in.',
      daysBefore: 30,
      categoryKey: 'attire',
    },
    {
      key: 'flowers',
      title: 'Order marigolds and flower jewellery',
      description: 'Fresh flowers wilt fast; collect them the morning of.',
      daysBefore: 21,
      categoryKey: 'details',
    },
    {
      key: 'cleanup',
      title: 'Plan towels, showers and the clean-up',
      description: 'Lots of old towels, and time before whatever comes next.',
      daysBefore: 7,
      categoryKey: 'week_of',
    },
  ],

  [EventKind.REHEARSAL_DINNER]: [
    {
      key: 'venue',
      title: 'Book the rehearsal dinner venue',
      description: 'Close to the ceremony venue, with a private room if you want toasts.',
      daysBefore: 120,
      categoryKey: 'venue',
      priority: HIGH,
    },
    {
      key: 'guest_list',
      title: 'Decide who comes to the rehearsal dinner',
      description: 'Usually the wedding party, close family and anyone travelling far.',
      daysBefore: 90,
      categoryKey: 'guests',
    },
    {
      key: 'invites',
      title: 'Invite the rehearsal dinner guests',
      description: 'A separate note so people know it is not for everyone.',
      daysBefore: 45,
      categoryKey: 'guests',
      waitsFor: ['guest_list', 'venue'],
    },
    {
      key: 'menu',
      title: 'Choose the rehearsal dinner menu',
      description: 'Ask the venue for a set menu and check the dietary needs you already have.',
      daysBefore: 30,
      categoryKey: 'vendors',
      waitsFor: ['venue'],
    },
    {
      key: 'toasts',
      title: 'Agree who gives a toast',
      description: 'Two or three is plenty. Tell them in advance.',
      daysBefore: 21,
      categoryKey: 'foundations',
    },
    {
      key: 'gifts',
      title: 'Prepare thank-you gifts for the wedding party',
      description: 'The rehearsal dinner is the traditional moment to give them.',
      daysBefore: 14,
      categoryKey: 'details',
    },
  ],

  [EventKind.WELCOME_PARTY]: [
    {
      key: 'venue',
      title: 'Book the welcome party venue',
      description: 'Somewhere easy to find from the hotels, with a relaxed feel.',
      daysBefore: 120,
      categoryKey: 'venue',
    },
    {
      key: 'food',
      title: 'Plan drinks and light food',
      description: 'People arrive hungry from travel; snacks and a signature drink go a long way.',
      daysBefore: 30,
      categoryKey: 'vendors',
      waitsFor: ['venue'],
    },
    {
      key: 'welcome_bags',
      title: 'Put together welcome bags',
      description: 'Water, snacks, a map, the weekend schedule. Drop them at the hotels.',
      daysBefore: 14,
      categoryKey: 'details',
    },
    {
      key: 'schedule',
      title: 'Share the weekend schedule with guests',
      description: 'What happens when and where - your wedding website can hold it.',
      daysBefore: 21,
      categoryKey: 'guests',
    },
  ],

  [EventKind.BRUNCH]: [
    {
      key: 'venue',
      title: 'Book the farewell brunch',
      description: 'Near the hotels, and late enough that people can recover.',
      daysBefore: 90,
      categoryKey: 'venue',
    },
    {
      key: 'headcount',
      title: 'Confirm the brunch headcount',
      description: 'Ask on the RSVP or count the out-of-town guests.',
      daysBefore: 14,
      categoryKey: 'guests',
      waitsFor: ['venue'],
    },
    {
      key: 'host',
      title: 'Ask someone to host the brunch',
      description: 'Often a parent. You will be tired; let someone else run it.',
      daysBefore: 30,
      categoryKey: 'foundations',
    },
  ],

  [EventKind.CEREMONY]: [
    {
      key: 'timeline',
      title: 'Set the ceremony timeline',
      description: 'Arrivals, processional, the ceremony itself and the exit, minute by minute.',
      daysBefore: 45,
      categoryKey: 'foundations',
    },
    {
      key: 'readings',
      title: 'Choose readings, rituals and readers',
      description: 'Ask the readers early and send them the text.',
      daysBefore: 60,
      categoryKey: 'foundations',
    },
    {
      key: 'music',
      title: 'Pick the ceremony music',
      description: 'Processional, signing and recessional, at the very least.',
      daysBefore: 45,
      categoryKey: 'vendors',
    },
    {
      key: 'seating',
      title: 'Reserve seats for family',
      description: 'Mark the front rows so no one has to ask.',
      daysBefore: 14,
      categoryKey: 'guests',
    },
  ],

  [EventKind.RECEPTION]: [
    {
      key: 'timeline',
      title: 'Set the reception timeline',
      description: 'Entrance, dinner, speeches, first dance, cake, last song.',
      daysBefore: 45,
      categoryKey: 'foundations',
    },
    {
      key: 'speeches',
      title: 'Agree the speeches and their order',
      description: 'Tell each speaker roughly how long they have.',
      daysBefore: 30,
      categoryKey: 'foundations',
      waitsFor: ['timeline'],
    },
    {
      key: 'first_dance',
      title: 'Choose the first dance song',
      description: 'And whether you are taking lessons.',
      daysBefore: 60,
      categoryKey: 'details',
    },
    {
      key: 'layout',
      title: 'Agree the room layout with the venue',
      description: 'Tables, dance floor, stage, bar and where the cake goes.',
      daysBefore: 30,
      categoryKey: 'venue',
    },
  ],
};

/** The checklist offered for an event kind; empty for "other". */
export function eventChecklist(kind) {
  return EVENT_CHECKLISTS[kind] ?? [];
}

/** What a task made from a checklist entry remembers, so it is not offered twice. */
export const templateKeyFor = (kind, key) => `${kind}:${key}`;

/** The checklist with each entry's date and whether this event already has it. */
export function eventChecklistFor(event, tasks = [], from = new Date()) {
  const added = new Set(
    tasks.filter((task) => task.eventId === event?.id && task.templateKey).map((task) => task.templateKey)
  );
  return eventChecklist(event?.kind).map((entry) => ({
    ...entry,
    templateKey: templateKeyFor(event.kind, entry.key),
    dueDate: checklistDueDate(event, entry, from),
    added: added.has(templateKeyFor(event.kind, entry.key)),
  }));
}

/**
 * The due date for an entry: `daysBefore` the event. A date already past is
 * moved to tomorrow (never after the event itself), so a late start does not
 * open with a page of overdue tasks. No event date, no due date.
 */
export function checklistDueDate(event, entry, from = new Date()) {
  if (!event?.date) return null;
  const natural = addDays(event.date, -entry.daysBefore);
  const tomorrow = addDays(toISODate(from), 1);
  if (daysUntil(natural, from) >= 1) return natural;
  return daysUntil(event.date, from) >= 1 ? tomorrow : event.date;
}

/**
 * Tasks for the chosen checklist entries (by key), ready for `addTasks`.
 * Links between chosen entries become `waitsFor`. A link to an entry this
 * event already has points at that existing task; a link to an entry left out
 * is dropped.
 */
export function buildEventTasks({ event, keys = [], categories = [], tasks = [], from = new Date() }) {
  const chosen = new Set(keys);
  const entries = eventChecklistFor(event, tasks, from).filter(
    (entry) => chosen.has(entry.key) && !entry.added
  );
  const categoryIdByKey = new Map(categories.map((category) => [category.key, category.id]));
  const existingByTemplate = new Map(
    tasks
      .filter((task) => task.eventId === event.id && task.templateKey)
      .map((task) => [task.templateKey, task.id])
  );

  const made = entries.map((entry) => ({
    entry,
    task: createTask({
      weddingId: event.weddingId,
      categoryId: categoryIdByKey.get(entry.categoryKey) ?? null,
      title: entry.title,
      description: entry.description ?? '',
      dueDate: entry.dueDate,
      priority: entry.priority ?? TaskPriority.NORMAL,
      isSystemGenerated: true,
      eventId: event.id,
      templateKey: entry.templateKey,
    }),
  }));
  const idByKey = new Map(made.map(({ entry, task }) => [entry.key, task.id]));

  return made.map(({ entry, task }) => {
    const waitsFor = (entry.waitsFor ?? [])
      .map((key) => idByKey.get(key) ?? existingByTemplate.get(templateKeyFor(event.kind, key)))
      .filter(Boolean);
    return waitsFor.length ? { ...task, waitsFor } : task;
  });
}
