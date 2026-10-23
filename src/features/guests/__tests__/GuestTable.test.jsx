import React from 'react';
import renderer, { act } from 'react-test-renderer';

import { ThemeProvider } from '@/design-system/theme';
import { RsvpStatus } from '@/models';

import { GuestTable } from '../GuestTable';
import { GuestColumn } from '../lib/guestTable';

const guests = [
  { id: 'a', firstName: 'Ana', lastName: 'Diaz', rsvpStatus: RsvpStatus.ATTENDING, tags: ['family'] },
  {
    id: 'b',
    firstName: 'Ben',
    lastName: 'Lee',
    rsvpStatus: RsvpStatus.PENDING,
    householdId: 'h1',
    isChild: true,
  },
];

function render(props = {}) {
  const handlers = {
    onSortChange: jest.fn(),
    onSelectionChange: jest.fn(),
    onOpen: jest.fn(),
  };
  let tree;
  act(() => {
    tree = renderer.create(
      <ThemeProvider>
        <GuestTable
          guests={guests}
          householdNameById={new Map([['h1', 'The Lees']])}
          sort={{ column: GuestColumn.NAME, direction: 'asc' }}
          selectedIds={[]}
          {...handlers}
          {...props}
        />
      </ThemeProvider>
    );
  });
  return { tree, ...handlers };
}

const byLabel = (tree, label) =>
  tree.root.find((node) => node.props.accessibilityLabel === label && node.props.onPress);
const texts = (tree) =>
  tree.root.findAll((node) => typeof node.children?.[0] === 'string').map((node) => node.children[0]);

describe('GuestTable', () => {
  it('shows every column for each guest', () => {
    const { tree } = render();
    const shown = texts(tree);
    for (const value of [
      'Ana Diaz',
      'Ben Lee',
      'The Lees',
      'Attending',
      'Awaiting reply',
      'Child',
      'family',
    ]) {
      expect(shown).toContain(value);
    }
  });

  it('sorts when a header is pressed, flipping the active column', () => {
    const { tree, onSortChange } = render();
    act(() => byLabel(tree, 'Sort by RSVP').props.onPress());
    expect(onSortChange).toHaveBeenLastCalledWith({ column: GuestColumn.RSVP, direction: 'asc' });
    act(() => byLabel(tree, 'Sort by Name, currently ascending').props.onPress());
    expect(onSortChange).toHaveBeenLastCalledWith({ column: GuestColumn.NAME, direction: 'desc' });
  });

  it('selects one guest, all guests, and clears', () => {
    const { tree, onSelectionChange } = render();
    act(() => byLabel(tree, 'Select Ben Lee').props.onPress());
    expect(onSelectionChange).toHaveBeenLastCalledWith(['b']);
    act(() => byLabel(tree, 'Select every guest shown').props.onPress());
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b']);

    const selected = render({ selectedIds: ['a', 'b', 'other'] });
    act(() => byLabel(selected.tree, 'Clear selection').props.onPress());
    // Clearing only drops the visible guests, not selections hidden by a filter.
    expect(selected.onSelectionChange).toHaveBeenLastCalledWith(['other']);
  });

  it('opens a guest from their name', () => {
    const { tree, onOpen } = render();
    act(() => byLabel(tree, 'Ana Diaz, Attending. Opens guest details.').props.onPress());
    expect(onOpen).toHaveBeenCalledWith(guests[0]);
  });
});
