import {
  DEFAULT_TASK_CATEGORIES,
  EVENT_CHECKLISTS,
  EventKind,
  buildEventTasks,
  checklistDueDate,
  createTaskCategory,
  createWeddingEvent,
  eventChecklist,
  eventChecklistFor,
} from '@/models';

const from = new Date(2027, 0, 1);
const mehndi = createWeddingEvent({ weddingId: 'w1', kind: EventKind.MEHNDI, date: '2027-06-01' });
const categories = DEFAULT_TASK_CATEGORIES.map((c) => createTaskCategory({ weddingId: 'w1', ...c }));

describe('event checklists', () => {
  const categoryKeys = new Set(DEFAULT_TASK_CATEGORIES.map((c) => c.key));

  it.each(Object.entries(EVENT_CHECKLISTS))('%s: entries are well formed', (kind, entries) => {
    expect(Object.values(EventKind)).toContain(kind);
    const keys = new Set(entries.map((entry) => entry.key));
    expect(keys.size).toBe(entries.length);
    for (const entry of entries) {
      expect(entry.title).toBeTruthy();
      expect(categoryKeys.has(entry.categoryKey)).toBe(true);
      expect(entry.daysBefore).toBeGreaterThanOrEqual(0);
      for (const key of entry.waitsFor ?? []) {
        // Links stay inside the list and point at something done earlier.
        expect(keys.has(key)).toBe(true);
        expect(entries.find((e) => e.key === key).daysBefore).toBeGreaterThanOrEqual(entry.daysBefore);
      }
    }
  });

  it('offers nothing for "other"', () => {
    expect(eventChecklist(EventKind.OTHER)).toEqual([]);
    expect(eventChecklist('unknown')).toEqual([]);
  });
});

describe('checklistDueDate', () => {
  it('dates back from the event', () => {
    expect(checklistDueDate(mehndi, { daysBefore: 45 }, from)).toBe('2027-04-17');
  });

  it('moves a date already past to tomorrow, never after the event', () => {
    const soon = { ...mehndi, date: '2027-01-20' };
    expect(checklistDueDate(soon, { daysBefore: 120 }, from)).toBe('2027-01-02');
    const tomorrow = { ...mehndi, date: '2027-01-02' };
    expect(checklistDueDate(tomorrow, { daysBefore: 3 }, from)).toBe('2027-01-02');
    const past = { ...mehndi, date: '2026-12-20' };
    expect(checklistDueDate(past, { daysBefore: 3 }, from)).toBe('2026-12-20');
  });

  it('has no date without an event date', () => {
    expect(checklistDueDate({ ...mehndi, date: null }, { daysBefore: 3 }, from)).toBeNull();
  });
});

describe('buildEventTasks', () => {
  it('makes the chosen tasks for the event, filed and dated', () => {
    const tasks = buildEventTasks({ event: mehndi, keys: ['artist', 'aftercare'], categories, from });
    expect(tasks.map((t) => t.title)).toEqual(['Book the henna artist', 'Prepare henna aftercare']);
    expect(tasks[0]).toMatchObject({
      weddingId: 'w1',
      eventId: mehndi.id,
      dueDate: '2027-02-01',
      priority: 'high',
      isSystemGenerated: true,
      templateKey: 'mehndi:artist',
      categoryId: categories.find((c) => c.key === 'vendors').id,
    });
  });

  it('links chosen tasks and drops links to ones left out', () => {
    const [artist, design] = buildEventTasks({ event: mehndi, keys: ['artist', 'design'], categories, from });
    expect(design.waitsFor).toEqual([artist.id]);
    const [alone] = buildEventTasks({ event: mehndi, keys: ['design'], categories, from });
    expect(alone.waitsFor).toEqual([]);
  });

  it('does not add what the event already has, and links to it instead', () => {
    const [artist] = buildEventTasks({ event: mehndi, keys: ['artist'], categories, from });
    const again = buildEventTasks({
      event: mehndi,
      keys: ['artist', 'design'],
      categories,
      tasks: [artist],
      from,
    });
    expect(again.map((t) => t.title)).toEqual(['Choose the bridal henna design']);
    expect(again[0].waitsFor).toEqual([artist.id]);

    const entries = eventChecklistFor(mehndi, [artist], from);
    expect(entries.find((e) => e.key === 'artist').added).toBe(true);
    expect(entries.find((e) => e.key === 'design').added).toBe(false);
  });

  it('treats each event separately', () => {
    const [artist] = buildEventTasks({ event: mehndi, keys: ['artist'], categories, from });
    const second = createWeddingEvent({ weddingId: 'w1', kind: EventKind.MEHNDI, date: '2027-06-02' });
    expect(eventChecklistFor(second, [artist], from).every((e) => !e.added)).toBe(true);
  });
});
