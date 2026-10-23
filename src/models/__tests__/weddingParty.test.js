import {
  PARTY_ROLES,
  ROLE_TODOS,
  memberBrief,
  memberProgress,
  partySummary,
  sortMembers,
  starterTodos,
  createPartyMember,
  createPartyTodo,
  memberFromGuest,
  validatePartyMember,
} from '../weddingParty';
import { createGuest } from '../guests';

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
  expect(memberProgress({ todos: [{ done: true }, { done: false }] })).toEqual({
    done: 1,
    total: 2,
    ratio: 0.5,
  });
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

describe('createPartyMember', () => {
  it('starts each role with its usual jobs and trims details', () => {
    const member = createPartyMember({
      weddingId: 'w1',
      name: ' Priya ',
      roleKey: 'best_man',
      phone: ' 555 ',
    });
    expect(member).toMatchObject({ name: 'Priya', roleKey: 'best_man', phone: '555', guestId: null });
    expect(member.id).toMatch(/^party_/);
    expect(member.todos.map((t) => t.title)).toContain('Look after the rings');
  });

  it('files an unknown role as "other"', () => {
    expect(createPartyMember({ name: 'A', roleKey: 'jester' }).roleKey).toBe('other');
  });

  it('keeps jobs it is given', () => {
    expect(createPartyMember({ name: 'A', roleKey: 'usher', todos: [] }).todos).toEqual([]);
  });
});

describe('memberFromGuest', () => {
  it('carries the guest name, contact and link', () => {
    const guest = createGuest({
      weddingId: 'w1',
      firstName: 'Meera',
      lastName: 'Shah',
      phone: '555',
      email: 'm@x.co',
    });
    expect(memberFromGuest(guest, { roleKey: 'bridesmaid' })).toMatchObject({
      weddingId: 'w1',
      name: 'Meera Shah',
      guestId: guest.id,
      phone: '555',
      email: 'm@x.co',
      roleKey: 'bridesmaid',
    });
  });
});

describe('validatePartyMember', () => {
  it('needs a name and a plausible email', () => {
    expect(validatePartyMember({ name: '' }).name).toBeTruthy();
    expect(validatePartyMember({ name: 'A', email: 'nope' }).email).toBeTruthy();
    expect(validatePartyMember({ name: 'A', email: 'a@b.co' })).toEqual({});
    expect(validatePartyMember({ name: 'A', outfit: 'x'.repeat(201) }).outfit).toBeTruthy();
  });
});

describe('createPartyTodo', () => {
  it('ignores empty titles and caps long ones', () => {
    expect(createPartyTodo('  ')).toBeNull();
    expect(createPartyTodo(' Pick up the cake ')).toMatchObject({ title: 'Pick up the cake', done: false });
    expect(createPartyTodo('x'.repeat(500)).title).toHaveLength(200);
  });
});
