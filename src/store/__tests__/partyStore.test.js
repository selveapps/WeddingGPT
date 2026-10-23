import { usePartyStore, selectPartyMembers, selectPartyMemberById } from '@/store';
import { PARTY_LIMITS } from '@/models';
import { importLabParty, LABS_PARTY_KEY } from '@/features/party/labsImport';

const store = () => usePartyStore.getState();
const member = (id) => selectPartyMemberById(id)(store());

beforeEach(() => store().reset());

describe('partyStore', () => {
  it('adds, edits and removes members', () => {
    const priya = store().addMember({ weddingId: 'w1', name: 'Priya', roleKey: 'maid_of_honor' });
    expect(selectPartyMembers(store()).map((m) => m.name)).toEqual(['Priya']);
    store().updateMember(priya.id, { outfit: 'Sage midi', size: '8' });
    expect(member(priya.id)).toMatchObject({ outfit: 'Sage midi', size: '8' });
    expect(store().updateMember('missing', {})).toBeNull();
    store().removeMember(priya.id);
    expect(selectPartyMembers(store())).toEqual([]);
  });

  it('ticks, adds and removes jobs on one member', () => {
    const sam = store().addMember({ name: 'Sam', roleKey: 'usher' });
    const [first] = sam.todos;
    store().toggleTodo(sam.id, first.id);
    expect(member(sam.id).todos[0].done).toBe(true);

    expect(store().addTodo(sam.id, '  ')).toBeNull();
    store().addTodo(sam.id, 'Collect the cufflinks');
    expect(member(sam.id).todos.at(-1)).toMatchObject({ title: 'Collect the cufflinks', done: false });

    store().removeTodo(sam.id, first.id);
    expect(member(sam.id).todos.map((t) => t.id)).not.toContain(first.id);
    expect(store().toggleTodo('missing', 'x')).toBeNull();
  });

  it(`caps jobs at ${PARTY_LIMITS.todosPerMember} and members at ${PARTY_LIMITS.members}`, () => {
    const busy = store().addMember({ name: 'Busy', roleKey: 'other', todos: [] });
    for (let i = 0; i < PARTY_LIMITS.todosPerMember; i += 1) store().addTodo(busy.id, `Job ${i}`);
    expect(store().addTodo(busy.id, 'One more')).toBeNull();
    expect(member(busy.id).todos).toHaveLength(PARTY_LIMITS.todosPerMember);

    usePartyStore.setState({
      members: { byId: {}, allIds: Array.from({ length: PARTY_LIMITS.members }, (_, i) => `m${i}`) },
    });
    expect(store().addMember({ name: 'Late' })).toBeNull();
  });
});

describe('importLabParty', () => {
  const storageWith = (value) => {
    const data = new Map([[LABS_PARTY_KEY, value]]);
    return {
      getItem: async (key) => data.get(key) ?? null,
      removeItem: async (key) => data.delete(key),
      data,
    };
  };

  it('brings Labs members over once, keeping ticked jobs', async () => {
    const items = [
      {
        id: 'lparty_1',
        name: 'Priya',
        roleKey: 'maid_of_honor',
        outfit: 'Sage',
        todos: [{ id: 'todo_a', title: 'Plan the shower', done: true }, { id: 'todo_b', title: '' }, null],
      },
      { id: 'lparty_2', name: '', roleKey: 'usher' },
    ];
    const storage = storageWith(
      JSON.stringify({
        state: {
          items: { byId: Object.fromEntries(items.map((i) => [i.id, i])), allIds: ['lparty_1', 'lparty_2'] },
        },
      })
    );
    expect(await importLabParty({ weddingId: 'w1', storage })).toBe(1);
    const [priya] = selectPartyMembers(store());
    expect(priya).toMatchObject({ name: 'Priya', roleKey: 'maid_of_honor', outfit: 'Sage', weddingId: 'w1' });
    expect(priya.todos).toEqual([expect.objectContaining({ title: 'Plan the shower', done: true })]);
    expect(storage.data.has(LABS_PARTY_KEY)).toBe(false);
    expect(await importLabParty({ storage: storageWith('{}') })).toBe(0);
  });
});
