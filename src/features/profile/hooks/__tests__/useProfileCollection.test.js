import React from 'react';
import renderer, { act } from 'react-test-renderer';

import { useProfileCollection } from '../useProfileCollection';
import { useWeddingStore } from '@/store/weddingStore';

function HookHarness({ onUpdate }) {
  onUpdate(useProfileCollection('notes'));
  return null;
}

describe('useProfileCollection', () => {
  let collection;
  let tree;

  beforeEach(() => {
    useWeddingStore.setState({
      wedding: { id: 'wedding-1', notes: [] },
    });
    collection = null;
  });

  it('adds, updates and removes records in the active workspace', () => {
    act(() => {
      tree = renderer.create(
        <HookHarness
          onUpdate={(value) => {
            collection = value;
          }}
        />
      );
    });
    let added;

    act(() => {
      added = collection.addRecord({ title: 'First dance', body: 'Our song' });
    });
    expect(collection.records).toHaveLength(1);
    expect(collection.records[0]).toMatchObject({
      id: added.id,
      title: 'First dance',
      body: 'Our song',
    });

    act(() => collection.updateRecord(added.id, { body: 'A new song' }));
    expect(collection.records[0].body).toBe('A new song');

    act(() => collection.removeRecord(added.id));
    expect(collection.records).toEqual([]);
    act(() => tree.unmount());
  });

  it('does not create or update records when no workspace exists', () => {
    useWeddingStore.setState({ wedding: null });
    act(() => {
      tree = renderer.create(
        <HookHarness
          onUpdate={(value) => {
            collection = value;
          }}
        />
      );
    });
    expect(collection.addRecord({ title: 'No workspace' })).toBeNull();
    expect(collection.updateRecord('missing', {})).toBeNull();
    expect(collection.removeRecord('missing')).toBe(false);
    act(() => tree.unmount());
  });
});
