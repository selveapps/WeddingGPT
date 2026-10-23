import { createSyncStore, selectPendingCount } from '../syncStore';

const change = (id, data = { id }) => ({ collection: 'tasks', id, op: 'upsert', data });

describe('syncStore', () => {
  let store;
  beforeEach(() => {
    store = createSyncStore({ persisted: false });
  });
  const state = () => store.getState();

  it('queues changes with the last known server version as base', () => {
    state().markPulled([{ collection: 'tasks', id: 'a', version: 4 }], 10);
    state().enqueue([change('a'), change('b')]);
    expect(state().outbox.map((m) => [m.id, m.baseVersion, m.op])).toEqual([
      ['a', 4, 'upsert'],
      ['b', 0, 'upsert'],
    ]);
    expect(state().outbox[0].mutationId).toMatch(/^mut_/);
    expect(selectPendingCount(state())).toBe(2);
  });

  it('keeps one queued change per record: the newest', () => {
    state().enqueue([change('a', { id: 'a', title: 'first' })]);
    state().enqueue([change('b')]);
    state().enqueue([{ collection: 'tasks', id: 'a', op: 'delete' }]);
    expect(state().outbox.map((m) => [m.id, m.op])).toEqual([
      ['b', 'upsert'],
      ['a', 'delete'],
    ]);
    expect(state().outbox[1].data).toBeUndefined();
  });

  it('does not mix up records with the same id in different collections', () => {
    state().enqueue([change('x'), { collection: 'guests', id: 'x', op: 'upsert', data: {} }]);
    expect(state().outbox).toHaveLength(2);
  });

  it('removes applied changes and remembers their new versions', () => {
    state().enqueue([change('a'), change('b')]);
    const sent = state().outbox;
    state().markPushed(sent, { applied: [{ mutationId: sent[0].mutationId, version: 1, seq: 5 }] });
    expect(state().outbox.map((m) => m.id)).toEqual(['b']);
    expect(state().known['tasks:a']).toBe(1);
  });

  it('rebases a change queued while an earlier push of the same record was in flight', () => {
    state().enqueue([change('a', { id: 'a', title: 'v1' })]);
    const sent = state().outbox;
    // The couple edits again before the push answers.
    state().enqueue([change('a', { id: 'a', title: 'v2' })]);
    state().markPushed(sent, { applied: [{ mutationId: sent[0].mutationId, version: 1, seq: 5 }] });

    expect(state().outbox).toHaveLength(1);
    expect(state().outbox[0]).toMatchObject({ data: { title: 'v2' }, baseVersion: 1 });
  });

  it('keeps conflict notices, newest first', () => {
    state().enqueue([change('a'), change('b')]);
    const sent = state().outbox;
    state().markPushed(sent, {
      applied: sent.map((m, i) => ({ mutationId: m.mutationId, version: 2, seq: i })),
      conflicts: [{ mutationId: sent[1].mutationId, overwritten: { version: 1, data: { title: 'theirs' } } }],
    });
    const [notice] = state().conflicts;
    expect(notice).toMatchObject({
      collection: 'tasks',
      recordId: 'b',
      overwritten: { data: { title: 'theirs' } },
    });

    state().dismissConflict(notice.id);
    expect(state().conflicts).toEqual([]);
  });

  it('drops refused changes from the outbox and records why', () => {
    state().enqueue([change('a')]);
    const sent = state().outbox;
    state().markPushed(sent, { rejected: [{ mutationId: sent[0].mutationId, error: 'too_large' }] });
    expect(state().outbox).toEqual([]);
    expect(state().rejected[0]).toMatchObject({ id: 'a', error: 'too_large' });
  });

  it('ignores results for mutations it did not send', () => {
    state().enqueue([change('a')]);
    state().markPushed([], { applied: [{ mutationId: 'mut_other', version: 9 }] });
    expect(state().outbox).toHaveLength(1);
    expect(state().known).toEqual({});
  });

  it('never moves the cursor backwards', () => {
    state().markPulled([], 20);
    state().markPulled([], 5);
    expect(state().cursor).toBe(20);
  });

  it('records the last result and resets', () => {
    state().setResult({ error: 'offline' });
    expect(state().lastError).toBe('offline');
    state().setResult({ syncedAt: '2027-01-01T00:00:00.000Z' });
    expect(state()).toMatchObject({ lastError: null, lastSyncedAt: '2027-01-01T00:00:00.000Z' });
    state().enqueue([change('a')]);
    state().reset();
    expect(state().outbox).toEqual([]);
  });
});
