import { pickDailyTasks, planDailyChecklists, summariseDailyTasks } from '../daily';
import { TaskPriority, TaskStatus } from '../enums';

const FROM = new Date(2027, 0, 4); // Monday 4 Jan 2027

const task = (id, dueDate, extra = {}) => ({
  id,
  title: `Task ${id}`,
  status: TaskStatus.TODO,
  dueDate,
  ...extra,
});

const ids = (list) => list.map((item) => item.id);

describe('pickDailyTasks', () => {
  it('puts overdue first, then due soon, then high priority', () => {
    const tasks = [
      task('later', '2027-06-01'),
      task('soon', '2027-01-10'),
      task('high', '2027-05-01', { priority: TaskPriority.HIGH }),
      task('overdue', '2027-01-01'),
    ];
    expect(ids(pickDailyTasks(tasks, { from: FROM }))).toEqual(['overdue', 'soon', 'high']);
  });

  it('orders overdue tasks oldest first and soon tasks soonest first', () => {
    const tasks = [
      task('o1', '2027-01-03'),
      task('o2', '2026-12-20'),
      task('s2', '2027-01-09'),
      task('s1', '2027-01-05'),
    ];
    expect(ids(pickDailyTasks(tasks, { from: FROM, size: 4 }))).toEqual(['o2', 'o1', 's1', 's2']);
  });

  it('puts undated tasks last, longest-lead first', () => {
    const tasks = [
      task('u1', null, { monthsBefore: 2 }),
      task('u2', null, { monthsBefore: 10 }),
      task('d', '2027-08-01'),
    ];
    expect(ids(pickDailyTasks(tasks, { from: FROM }))).toEqual(['d', 'u2', 'u1']);
  });

  it('skips done, skipped, actively snoozed and excluded tasks', () => {
    const tasks = [
      task('done', '2027-01-01', { status: TaskStatus.DONE }),
      task('skipped', '2027-01-01', { status: TaskStatus.SKIPPED }),
      task('snoozed', '2027-01-01', { status: TaskStatus.SNOOZED, snoozedUntil: '2027-01-08' }),
      task('woken', '2027-01-02', { status: TaskStatus.SNOOZED, snoozedUntil: '2027-01-04' }),
      task('excluded', '2027-01-01'),
    ];
    expect(ids(pickDailyTasks(tasks, { from: FROM, exclude: ['excluded'] }))).toEqual(['woken']);
  });
});

describe('planDailyChecklists', () => {
  const tasks = Array.from({ length: 7 }, (_, i) => task(`t${i}`, `2027-01-${10 + i}`));

  it('hands out different tasks each day until they run out', () => {
    const plan = planDailyChecklists(tasks, { from: FROM, days: 5 });
    expect(plan.map((day) => ids(day.tasks))).toEqual([
      ['t0', 't1', 't2'],
      ['t3', 't4', 't5'],
      ['t6'],
    ]);
    expect(plan[1].date).toEqual(new Date(2027, 0, 5));
  });

  it('reuses the list already shown today, minus anything finished', () => {
    const firstDay = [task('t6', '2027-01-16'), task('gone', null, { status: TaskStatus.DONE })];
    const plan = planDailyChecklists(tasks, { from: FROM, days: 2, firstDay });
    expect(ids(plan[0].tasks)).toEqual(['t6']);
    expect(ids(plan[1].tasks)).toEqual(['t0', 't1', 't2']);
  });

  it('returns nothing when there is nothing to do', () => {
    expect(planDailyChecklists([], { from: FROM })).toEqual([]);
  });
});

describe('summariseDailyTasks', () => {
  it('reads naturally for one, two and many tasks', () => {
    expect(summariseDailyTasks([])).toBe('');
    expect(summariseDailyTasks([{ title: 'Book venue' }])).toBe('Book venue');
    expect(summariseDailyTasks([{ title: 'A' }, { title: 'B' }])).toBe('A and B');
    expect(
      summariseDailyTasks([{ title: 'A' }, { title: 'B' }, { title: 'C' }, { title: 'D' }])
    ).toBe('A, B and 2 more');
  });
});
