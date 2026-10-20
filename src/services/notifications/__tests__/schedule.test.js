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
