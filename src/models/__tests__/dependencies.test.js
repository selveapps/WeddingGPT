import {
  CHECKLIST_TEMPLATE,
  DEPENDENCY_LIMITS,
  TEMPLATE_DEPENDENCIES,
  TaskStatus,
  createTask,
  createWedding,
  dependencyError,
  dependentsOf,
  generatePersonalisedPlan,
  isTaskWaiting,
  linkTemplateDependencies,
  openPrerequisites,
  pickDailyTasks,
  planDailyChecklists,
  prerequisitesOf,
  pruneDependencies,
  selectNextBestAction,
} from '@/models';

const task = (id, fields = {}) => ({ ...createTask({ title: id, ...fields }), id });

describe('waiting', () => {
  const list = task('list', { status: TaskStatus.DONE });
  const venue = task('venue');
  const skipped = task('skipped', { status: TaskStatus.SKIPPED });
  const invites = task('invites', { waitsFor: ['list', 'venue', 'skipped', 'deleted'] });
  const tasks = [list, venue, skipped, invites];

  it('lists the prerequisites that still exist', () => {
    expect(prerequisitesOf(invites, tasks).map((t) => t.id)).toEqual(['list', 'venue', 'skipped']);
  });

  it('is blocked only by prerequisites still to do', () => {
    expect(openPrerequisites(invites, tasks).map((t) => t.id)).toEqual(['venue']);
    expect(isTaskWaiting(invites, tasks)).toBe(true);
    expect(isTaskWaiting(invites, tasks, new Set(['venue']))).toBe(false);
    expect(isTaskWaiting(venue, tasks)).toBe(false);
  });

  it('a finished task is never waiting, whatever it waited for', () => {
    expect(isTaskWaiting({ ...invites, status: TaskStatus.DONE }, tasks)).toBe(false);
  });

  it('accepts a Map as well as a list', () => {
    const byId = new Map(tasks.map((t) => [t.id, t]));
    expect(isTaskWaiting(invites, byId)).toBe(true);
    expect(dependentsOf('venue', byId).map((t) => t.id)).toEqual(['invites']);
  });
});

describe('dependencyError', () => {
  const a = task('a');
  const b = task('b', { waitsFor: ['a'] });
  const c = task('c', { waitsFor: ['b'] });
  const tasks = [a, b, c];

  it('allows a new link', () => {
    expect(dependencyError('c', 'a', tasks)).toBeNull();
  });

  it('refuses itself, repeats and missing tasks', () => {
    expect(dependencyError('a', 'a', tasks)).toMatch(/itself/);
    expect(dependencyError('b', 'a', tasks)).toMatch(/already waits/);
    expect(dependencyError('a', 'gone', tasks)).toMatch(/no longer exists/);
    expect(dependencyError('gone', 'a', tasks)).toMatch(/no longer exists/);
  });

  it('refuses a loop, direct or through other tasks', () => {
    expect(dependencyError('a', 'b', tasks)).toMatch(/waits for this one/);
    expect(dependencyError('a', 'c', tasks)).toMatch(/waits for this one/);
  });

  it('copes with a loop that arrived through sync', () => {
    const x = task('x', { waitsFor: ['y'] });
    const y = task('y', { waitsFor: ['x'] });
    const z = task('z');
    expect(dependencyError('z', 'x', [x, y, z])).toBeNull();
    expect(dependencyError('x', 'z', [x, y, z])).toBeNull();
    expect(isTaskWaiting(x, [x, y])).toBe(true);
  });

  it(`stops at ${DEPENDENCY_LIMITS.perTask} prerequisites`, () => {
    const many = Array.from({ length: DEPENDENCY_LIMITS.perTask + 1 }, (_, i) => task(`p${i}`));
    const busy = task('busy', { waitsFor: many.slice(0, DEPENDENCY_LIMITS.perTask).map((t) => t.id) });
    expect(dependencyError('busy', many.at(-1).id, [...many, busy])).toMatch(/up to/);
  });
});

describe('pruneDependencies', () => {
  it('drops links to deleted tasks and reports only what changed', () => {
    const tasks = [task('a', { waitsFor: ['gone', 'b'] }), task('b'), task('c', { waitsFor: ['b'] })];
    expect(pruneDependencies(tasks, ['gone'])).toEqual([{ id: 'a', waitsFor: ['b'] }]);
    expect(pruneDependencies(tasks, [])).toEqual([]);
  });
});

describe('the plan template', () => {
  const titles = new Map(CHECKLIST_TEMPLATE.map((entry) => [entry.title, entry]));

  it('links only tasks that exist in the template', () => {
    for (const [title, prerequisites] of Object.entries(TEMPLATE_DEPENDENCIES)) {
      expect(titles.has(title)).toBe(true);
      for (const prerequisite of prerequisites) expect(titles.has(prerequisite)).toBe(true);
    }
  });

  it('never asks a task to wait for something normally done later', () => {
    for (const [title, prerequisites] of Object.entries(TEMPLATE_DEPENDENCIES)) {
      for (const prerequisite of prerequisites) {
        expect(titles.get(prerequisite).monthsBefore).toBeGreaterThanOrEqual(titles.get(title).monthsBefore);
      }
    }
  });

  it('has no loops', () => {
    const tasks = linkTemplateDependencies(CHECKLIST_TEMPLATE.map((entry) => task(entry.title)));
    const byId = new Map(tasks.map((t) => [t.id, t]));
    const reachesItself = (start) => {
      const seen = new Set();
      const stack = [...start.waitsFor];
      while (stack.length) {
        const id = stack.pop();
        if (id === start.id) return true;
        if (seen.has(id)) continue;
        seen.add(id);
        stack.push(...(byId.get(id)?.waitsFor ?? []));
      }
      return false;
    };
    expect(tasks.filter(reachesItself).map((t) => t.title)).toEqual([]);
    expect(tasks.filter((t) => t.waitsFor.length).length).toBe(Object.keys(TEMPLATE_DEPENDENCIES).length);
  });

  it('links a generated plan, and leaves out tasks a short plan dropped', () => {
    const wedding = createWedding({ date: '2027-10-01', dateType: 'exact' });
    const { tasks } = generatePersonalisedPlan({ wedding, from: new Date(2026, 9, 1) });
    const byTitle = new Map(tasks.map((t) => [t.title, t]));
    expect(byTitle.get('Send the invitations').waitsFor).toEqual([
      byTitle.get('Build the full guest list').id,
      byTitle.get('Book the ceremony venue').id,
    ]);

    const linked = linkTemplateDependencies([
      task('Book the ceremony venue'),
      task('Choose your date or window'),
    ]);
    expect(linked[0].waitsFor).toEqual(['Choose your date or window']);
  });
});

describe('daily checklist and next action', () => {
  const from = new Date(2027, 0, 10);
  const list = task('list', { dueDate: '2027-01-20' });
  const invites = task('invites', { dueDate: '2027-01-05', waitsFor: ['list'] });
  const rings = task('rings', { dueDate: '2027-03-01' });

  it('leaves out tasks still waiting, even overdue ones', () => {
    expect(pickDailyTasks([list, invites, rings], { from }).map((t) => t.id)).toEqual(['list', 'rings']);
    expect(selectNextBestAction([list, invites, rings], from).id).toBe('list');
  });

  it('brings a task in once what it waits for is done', () => {
    const done = { ...list, status: TaskStatus.DONE };
    expect(pickDailyTasks([done, invites, rings], { from }).map((t) => t.id)).toEqual(['invites', 'rings']);
  });

  it('plans the waiting task for the day after its prerequisite', () => {
    const days = planDailyChecklists([list, invites], { from, days: 3 });
    expect(days.map((day) => day.tasks.map((t) => t.id))).toEqual([['list'], ['invites']]);
  });
});
