import React from 'react';
import { useWindowDimensions } from 'react-native';

import { useGuestStore, useSeatingStore, selectSeatingTables, useWeddingStore } from '@/store';
import { createGuest, createWedding, RsvpStatus } from '@/models';
import { act, press, renderWithProviders, shownTexts } from '@/test/render';

import { SeatingScreen } from '../SeatingScreen';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: jest.fn(() => ({ width: 390, height: 844, scale: 2, fontScale: 1 })),
}));

const tables = () => selectSeatingTables(useSeatingStore.getState());
const fields = (tree, label) =>
  tree.root.findAll((n) => n.props.label === label && typeof n.props.onChangeText === 'function');
const field = (tree, label) => fields(tree, label)[0];
/** The edit sheet renders after the add-table card, so its field is the last match. */
const sheetField = (tree, label) => fields(tree, label).at(-1);

let meera;
beforeEach(() => {
  useSeatingStore.getState().reset();
  useSeatingStore.setState({ labsImportedAt: 'done' });
  useGuestStore.getState().reset();
  const wedding = createWedding({ ownerName: 'Priya' });
  useWeddingStore.setState({ wedding });
  meera = useGuestStore
    .getState()
    .addGuest(createGuest({ weddingId: wedding.id, firstName: 'Meera', rsvpStatus: RsvpStatus.ATTENDING }));
  useGuestStore
    .getState()
    .addGuest(createGuest({ weddingId: wedding.id, firstName: 'Dec', rsvpStatus: RsvpStatus.DECLINED }));
});

const render = () => renderWithProviders(<SeatingScreen />);

describe('SeatingScreen', () => {
  it('adds a table and seats a guest from the list', async () => {
    const tree = await render();
    await act(async () => field(tree, 'Table name').props.onChangeText('Family'));
    await press(tree, 'Add table');
    expect(tables().map((t) => t.name)).toEqual(['Family']);

    // Declined guests are not on the plan.
    expect(shownTexts(tree)).toContain('Need a seat (1)');
    await press(tree, 'Meera');
    await press(tree, 'Family');
    expect(tables()[0].guestIds).toEqual([meera.id]);
    expect(shownTexts(tree)).toContain('Everyone has a seat.');
  });

  it('auto-seats everyone who needs a seat', async () => {
    useSeatingStore.getState().addTable({ name: 'T1' });
    const tree = await render();
    await press(tree, 'Auto-seat everyone');
    expect(tables()[0].guestIds).toEqual([meera.id]);
  });

  it('renames and resizes a table, and deletes it after confirming', async () => {
    useSeatingStore.getState().addTable({ name: 'T1', capacity: 8 });
    const tree = await render();
    await press(tree, 'T1, 0 of 8 seats');
    await act(async () => sheetField(tree, 'Seats').props.onChangeText('10'));
    await press(tree, 'Save');
    expect(tables()[0].capacity).toBe(10);

    await press(tree, 'T1, 0 of 10 seats');
    await press(tree, 'Delete table');
    await press(tree, 'Delete');
    expect(tables()).toEqual([]);
  });

  it('frees the seat of a guest who was deleted', async () => {
    const table = useSeatingStore.getState().addTable({ name: 'T1' });
    useSeatingStore.getState().assign(table.id, 'guest_gone');
    await render();
    expect(tables()[0].guestIds).toEqual([]);
  });

  it('lays tables and the guest list side by side on a wide screen', async () => {
    useWindowDimensions.mockReturnValue({ width: 1200, height: 800, scale: 1, fontScale: 1 });
    useSeatingStore.getState().addTable({ name: 'T1' });
    const tree = await render();
    const card = tree.root.find((n) => n.props.accessibilityLabel === 'T1, 0 of 8 seats' && n.props.style);
    expect(card.props.style).toMatchObject({ width: 280 });
    useWindowDimensions.mockReturnValue({ width: 390, height: 844, scale: 2, fontScale: 1 });
  });
});
