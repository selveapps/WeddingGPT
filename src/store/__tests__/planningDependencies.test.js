import { usePlanningStore } from '@/store';

const store = () => usePlanningStore.getState();
const get = (id) => store().tasks.byId[id];

let list;
let invites;
let rsvps;
beforeEach(() => {
  store().reset();
  list = store().addTask({ title: 'Build the full guest list' });
  invites = store().addTask({ title: 'Send the invitations' });
  rsvps = store().addTask({ title: 'Chase outstanding RSVPs' });
});

describe('planningStore dependencies', () => {
  it('adds and removes a prerequisite', () => {
    expect(store().addPrerequisite(invites.id, list.id)).toEqual({ ok: true });
    expect(get(invites.id).waitsFor).toEqual([list.id]);
    expect(store().removePrerequisite(invites.id, list.id)).toBe(true);
    expect(get(invites.id).waitsFor).toEqual([]);
    expect(store().removePrerequisite(invites.id, list.id)).toBe(false);
  });

  it('refuses a loop and leaves the tasks as they were', () => {
    store().addPrerequisite(invites.id, list.id);
    store().addPrerequisite(rsvps.id, invites.id);
    const before = get(list.id);

    const result = store().addPrerequisite(list.id, rsvps.id);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/waits for this one/);
    expect(get(list.id)).toBe(before);
  });

  it('deleting a task frees the tasks that waited for it', () => {
    store().addPrerequisite(invites.id, list.id);
    store().addPrerequisite(rsvps.id, list.id);
    store().addPrerequisite(rsvps.id, invites.id);

    store().deleteTask(list.id);
    expect(get(list.id)).toBeUndefined();
    expect(get(invites.id).waitsFor).toEqual([]);
    expect(get(rsvps.id).waitsFor).toEqual([invites.id]);
  });

  it('a task can still be ticked off while it waits', () => {
    store().addPrerequisite(invites.id, list.id);
    expect(store().toggleTask(invites.id).status).toBe('done');
  });
});
