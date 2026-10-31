import React from 'react';

import { usePackingStore, useWeddingStore, selectPackingItems } from '@/store';
import { createWedding, itemsFor, templateItems } from '@/models';
import { act, press, pressables, renderWithProviders, shownTexts } from '@/test/render';

import { PackingScreen } from '../PackingScreen';

const mockShare = jest.fn(async () => true);
jest.mock('@/services/share', () => ({ shareText: (...args) => mockShare(...args) }));

const list = (key) => itemsFor(selectPackingItems(usePackingStore.getState()), key);
const field = (tree, label) =>
  tree.root.find((n) => n.props.label === label && typeof n.props.onChangeText === 'function');

beforeEach(() => {
  jest.clearAllMocks();
  usePackingStore.getState().reset();
  usePackingStore.setState({ labsImportedAt: 'done' });
  useWeddingStore.setState({ wedding: createWedding({ ownerName: 'Priya' }) });
});

const render = () => renderWithProviders(<PackingScreen />);

describe('PackingScreen', () => {
  it('starts a list only when asked', async () => {
    const tree = await render();
    expect(list('emergency')).toEqual([]);
    await press(tree, 'Start from our list');
    expect(list('emergency')).toHaveLength(templateItems('emergency').length);
    // Titles are on screen, not only read out.
    expect(shownTexts(tree)).toEqual(expect.arrayContaining(['Safety pins', 'Mints']));
  });

  it('ticks items off and shows progress on the list chip', async () => {
    usePackingStore.getState().startFromTemplate('honeymoon', 'w1');
    const tree = await render();
    await press(tree, 'Honeymoon 0/9');
    await press(tree, 'Sunscreen');
    expect(list('honeymoon').find((i) => i.title === 'Sunscreen').packed).toBe(true);
    expect(shownTexts(tree)).toContain('1 of 9 packed');
    expect(pressables(tree, 'Honeymoon 1/9')).toHaveLength(1);
  });

  it('adds your own item and removes one with undo', async () => {
    const tree = await render();
    await act(async () => field(tree, 'Add your own').props.onChangeText("Grandma's handkerchief"));
    await press(tree, 'Add');
    expect(list('emergency').map((i) => i.title)).toEqual(["Grandma's handkerchief"]);

    await press(tree, "Remove Grandma's handkerchief");
    expect(list('emergency')).toEqual([]);
    await press(tree, 'Undo');
    expect(list('emergency')).toHaveLength(1);
  });

  it('renames an item on long press', async () => {
    usePackingStore.getState().addCustom('emergency', 'Pins', 'w1');
    const tree = await render();
    const row = pressables(tree, 'Pins')[0];
    await act(async () => row.props.onLongPress());
    await act(async () => field(tree, 'Item').props.onChangeText('Gold pins'));
    await press(tree, 'Save');
    expect(list('emergency')[0].title).toBe('Gold pins');
  });

  it('puts back removed defaults and shares the list', async () => {
    usePackingStore.getState().startFromTemplate('emergency', 'w1');
    const [first] = list('emergency');
    usePackingStore.getState().removeItem(first.id);
    const tree = await render();
    await press(tree, 'Put back 1 removed');
    expect(list('emergency').some((i) => i.id === first.id)).toBe(true);

    await press(tree, 'Share this list');
    const [text, title] = mockShare.mock.calls[0];
    expect(title).toBe('Emergency kit');
    // Put-back items go to the end of the list.
    expect(text).toMatch(/^Emergency kit\n\n/);
    expect(text).toContain(`[ ] ${first.title}`);
  });
});
