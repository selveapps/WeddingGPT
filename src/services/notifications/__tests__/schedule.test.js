import { buildReminderSchedule } from '../index';
import { NotificationType } from '../../../models';

jest.mock('expo-notifications', () => ({}));

const NOW = new Date(2027, 0, 4, 7, 0, 0); // Monday 4 Jan 2027, 7am

const task = (id, dueDate, extra = {}) => ({ id, title: `Task ${id}`, status: 'todo', dueDate, ...extra });

const busyDay = {
  // On 18 Jan: a task due on the 20th (2 days ahead), one overdue from the
  // 17th, a payment due on the 21st (3 days ahead), plus the daily checklist.
  tasks: [task('due', '2027-01-20'), task('late', '2027-01-17')],
  expenses: [{ id: 'e1', title: 'Caterer deposit', amount: 500, paidAmount: 0, dueDate: '2027-01-21' }],
  preferences: { enabled: true, types: { [NotificationType.WEEKLY_DIGEST]: false } },
  now: NOW,
};

describe('buildReminderSchedule', () => {
  it('schedules nothing when reminders are switched off', () => {
    const schedule = buildReminderSchedule({
      tasks: [task('a', '2027-01-20')],
      preferences: { enabled: false },
      now: NOW,
    });
    expect(schedule).toEqual([]);
  });

  it('merges tasks due on the same day into one reminder', () => {
    const schedule = buildReminderSchedule({
      tasks: ['a', 'b', 'c', 'd'].map((id) => task(id, '2027-01-20')),
      preferences: {
        enabled: true,
        types: {
          [NotificationType.DAILY_CHECKLIST]: false,
          [NotificationType.WEEKLY_DIGEST]: false,
          [NotificationType.TASK_OVERDUE]: false,
        },
      },
      now: NOW,
    });

    expect(schedule).toHaveLength(1);
    expect(schedule[0].title).toBe('4 tasks coming up in 2 days');
    expect(schedule[0].body).toBe('Task a, Task b, Task c and 1 more.');
  });

  it('never schedules more than three reminders on one day', () => {
    const counts = {};
    for (const item of buildReminderSchedule(busyDay)) {
      const key = item.date.toDateString();
      counts[key] = (counts[key] ?? 0) + 1;
    }
    for (const count of Object.values(counts)) {
      expect(count).toBeLessThanOrEqual(3);
    }
  });

  it('keeps the most important reminders when a day is over the cap', () => {
    const onThe18th = buildReminderSchedule(busyDay)
      .filter((item) => item.date.getDate() === 18)
      .map((item) => item.type);

    expect(onThe18th).toHaveLength(3);
    expect(onThe18th).toEqual(
      expect.arrayContaining([NotificationType.PAYMENT_DUE, NotificationType.TASK_OVERDUE, NotificationType.TASK_DUE])
    );
    expect(onThe18th).not.toContain(NotificationType.DAILY_CHECKLIST);
  });

  it('skips completed tasks and paid expenses', () => {
    const schedule = buildReminderSchedule({
      tasks: [task('done', '2027-01-20', { status: 'done' })],
      expenses: [{ id: 'e1', title: 'Paid', amount: 500, paidAmount: 500, dueDate: '2027-01-21' }],
      preferences: { enabled: true, types: { [NotificationType.DAILY_CHECKLIST]: false, [NotificationType.WEEKLY_DIGEST]: false } },
      now: NOW,
    });
    expect(schedule).toEqual([]);
  });
});

describe('buildReminderSchedule for events (G2)', () => {
  const only = (...types) => ({
    enabled: true,
    types: Object.fromEntries(
      Object.values(NotificationType).map((type) => [type, types.includes(type)])
    ),
  });
  const guest = (id, rsvpStatus, extra = {}) => ({ id, firstName: id, rsvpStatus, ...extra });
  const mehndi = {
    id: 'ev1',
    kind: 'mehndi',
    name: 'Mehndi',
    date: '2027-02-12',
    startTime: '16:00',
    endTime: '21:00',
    venueName: 'The Rose Garden',
    dressCode: 'Bright colours',
    guestScope: 'invited',
    invitedGuestIds: ['a', 'b', 'c'],
    attendance: { b: 'declined' },
  };
  const guests = [
    guest('a', 'attending', { plusOneStatus: 'confirmed' }),
    guest('b', 'attending'),
    guest('c', 'pending'),
    guest('d', 'attending'),
  ];

  it('reminds three days before each event, with its time, place and dress code', () => {
    const [item] = buildReminderSchedule({
      events: [mehndi],
      guests,
      preferences: only(NotificationType.EVENT_SOON),
      now: NOW,
    });
    expect(item.title).toBe('Mehndi is in 3 days');
    expect(item.body).toContain('The Rose Garden');
    expect(item.body).toContain('Dress code: Bright colours');
    expect(item.url).toBe('/planning/events/ev1');
    expect(item.date).toEqual(new Date(2027, 1, 9, 9, 0, 0));
  });

  it("asks for the caterer's final numbers a week out, counting only that event's plates", () => {
    const [item] = buildReminderSchedule({
      events: [mehndi],
      guests,
      preferences: only(NotificationType.CATERER_NUMBERS),
      now: NOW,
    });
    // a and her plus-one; b declined the mehndi; d is not invited to it.
    expect(item.title).toBe('Final numbers for the Mehndi');
    expect(item.body).toBe('2 plates so far, 1 still to answer.');
    expect(item.url).toBe('/guests/meals?event=ev1');
    expect(item.date).toEqual(new Date(2027, 1, 5, 9, 0, 0));
  });

  it('skips undated events, past events, and caterer numbers for an event nobody is invited to', () => {
    const schedule = buildReminderSchedule({
      events: [
        { ...mehndi, id: 'undated', date: null },
        { ...mehndi, id: 'past', date: '2026-12-01' },
        { ...mehndi, id: 'empty', date: '2027-03-01', invitedGuestIds: [] },
      ],
      guests,
      preferences: only(NotificationType.EVENT_SOON, NotificationType.CATERER_NUMBERS),
      now: NOW,
    });
    expect(schedule.map((item) => [item.type, item.url])).toEqual([
      [NotificationType.EVENT_SOON, '/planning/events/empty'],
    ]);
  });

  it('folds two events on the same reminder day into one', () => {
    const schedule = buildReminderSchedule({
      events: [mehndi, { ...mehndi, id: 'ev2', kind: 'sangeet', name: 'Sangeet' }],
      guests,
      preferences: only(NotificationType.EVENT_SOON),
      now: NOW,
    });
    expect(schedule).toHaveLength(1);
    expect(schedule[0].title).toBe('2 events in 3 days');
    expect(schedule[0].body).toBe('Mehndi, Sangeet.');
    expect(schedule[0].url).toBe('/planning/events');
  });

  it('respects the switches for each kind', () => {
    const schedule = buildReminderSchedule({
      events: [mehndi],
      guests,
      preferences: only(NotificationType.MILESTONES),
      now: NOW,
    });
    expect(schedule).toEqual([]);
  });
});
