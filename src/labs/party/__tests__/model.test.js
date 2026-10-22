import {
  PARTY_ROLES,
  ROLE_TODOS,
  memberBrief,
  memberProgress,
  partySummary,
  sortMembers,
  starterTodos,
} from '../model';

it('has starter todos for every role', () => {
  for (const role of PARTY_ROLES) expect(ROLE_TODOS[role.key]).toBeDefined();
});

it('creates unchecked starter todos with unique ids', () => {
  const todos = starterTodos('best_man');
  expect(todos.map((t) => t.title)).toContain('Look after the rings');
  expect(todos.every((t) => !t.done)).toBe(true);
  expect(new Set(todos.map((t) => t.id)).size).toBe(todos.length);
});

it('measures progress, treating no todos as done', () => {
  expect(memberProgress({ todos: [{ done: true }, { done: false }] })).toEqual({ done: 1, total: 2, ratio: 0.5 });
  expect(memberProgress({ todos: [] }).ratio).toBe(1);
});

it('counts missing outfits only for roles that wear one', () => {
  const summary = partySummary([
    { roleKey: 'bridesmaid', outfit: '', todos: [{ done: true }] },
    { roleKey: 'groomsman', outfit: 'Navy suit', todos: [{ done: false }] },
    { roleKey: 'usher', outfit: '', todos: [] },
  ]);
  expect(summary).toEqual({ total: 3, todosDone: 1, todosTotal: 2, outfitsMissing: 1 });
});

it('sorts by role then name', () => {
  const sorted = sortMembers([
    { name: 'Zoe', roleKey: 'bridesmaid' },
    { name: 'Amy', roleKey: 'bridesmaid' },
    { name: 'Kai', roleKey: 'maid_of_honor' },
  ]);
  expect(sorted.map((m) => m.name)).toEqual(['Kai', 'Amy', 'Zoe']);
});

it('writes a brief with open todos and outfit', () => {
  const brief = memberBrief(
    {
      name: 'Priya Shah',
      roleKey: 'bridesmaid',
      outfit: 'Sage midi',
      size: '8',
      todos: [
        { title: 'Order your outfit', done: true },
        { title: 'Go to the fitting', done: false },
      ],
    },
    { coupleName: 'Sam and Alex', dateText: 'June 19, 2027' }
  );
  expect(brief).toContain('Hi Priya!');
  expect(brief).toContain('our bridesmaid on June 19, 2027');
  expect(brief).toContain('- Go to the fitting');
  expect(brief).not.toContain('- Order your outfit');
  expect(brief).toContain('Outfit: Sage midi (size 8)');
});
