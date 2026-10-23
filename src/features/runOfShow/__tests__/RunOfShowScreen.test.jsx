import React from 'react';

import { useEventStore, useRunOfShowStore, useWeddingStore, selectRunOfShow } from '@/store';
import { SAMPLE_DAY, createWedding, itemsForDay } from '@/models';
import { act, press, pressables, renderWithProviders, shownTexts } from '@/test/render';

import { RunOfShowScreen } from '../RunOfShowScreen';

const mockShare = jest.fn(async () => true);
jest.mock('@/services/share', () => ({ shareText: (...args) => mockShare(...args) }));

const items = () => selectRunOfShow(useRunOfShowStore.getState());
const field = (tree, label) =>
  tree.root.find((n) => n.props.label === label && typeof n.props.onChangeText === 'function');
const type = (tree, label, text) => act(async () => field(tree, label).props.onChangeText(text));

beforeEach(() => {
  jest.clearAllMocks();
  useRunOfShowStore.getState().reset();
  useRunOfShowStore.setState({ labsImportedAt: 'done' });
  useEventStore.getState().reset();
  useWeddingStore.setState({ wedding: createWedding({ ownerName: 'Priya', partnerName: 'Sam' }) });
});

describe('RunOfShowScreen', () => {
  it('starts the day from a typical wedding day', async () => {
    const tree = await renderWithProviders(<RunOfShowScreen />);
    await press(tree, 'Start from a typical day');
    expect(items()).toHaveLength(SAMPLE_DAY.length);
    expect(shownTexts(tree)).toEqual(expect.arrayContaining(['Ceremony', '4:00 PM']));
  });

  it('adds an item from a typed time and refuses one it cannot read', async () => {
    useRunOfShowStore.getState().addItem({ title: 'Ceremony', start: 960 });
    const tree = await renderWithProviders(<RunOfShowScreen />);
    await press(tree, 'Add to the day');
    await type(tree, 'What', 'Cake cutting');
    await type(tree, 'Starts', 'after dinner');
    await press(tree, 'Add');
    expect(items()).toHaveLength(1);
    expect(shownTexts(tree)).toContain('Try 4:30 PM or 16:30.');

    await type(tree, 'Starts', '8:45pm');
    await type(tree, 'Minutes', '15');
    await press(tree, 'Add');
    expect(items().find((i) => i.title === 'Cake cutting')).toMatchObject({ start: 1245, durationMin: 15 });
  });

  it('edits an item and deletes it with undo', async () => {
    useRunOfShowStore.getState().addItem({ title: 'Speeches', start: 1170, durationMin: 30 });
    const tree = await renderWithProviders(<RunOfShowScreen />);
    await press(tree, 'Edit Speeches');
    expect(field(tree, 'Starts').props.value).toBe('7:30 PM');
    await type(tree, 'Who runs it (optional)', 'MC');
    await press(tree, 'Save');
    expect(items()[0].owner).toBe('MC');

    await press(tree, 'Edit Speeches');
    await press(tree, 'Delete');
    expect(items()).toEqual([]);
    await press(tree, 'Undo');
    expect(items().map((i) => i.title)).toEqual(['Speeches']);
  });

  it('pushes the rest of the day back when running late, with undo', async () => {
    useRunOfShowStore.getState().addItem({ title: 'Dinner', start: 1080, durationMin: 90 });
    useRunOfShowStore.getState().addItem({ title: 'Dance', start: 1200 });
    const tree = await renderWithProviders(<RunOfShowScreen />);
    await press(tree, 'Move Dinner and what follows 15 minutes later');
    expect(
      items()
        .map((i) => i.start)
        .sort()
    ).toEqual([1095, 1215]);
    await press(tree, 'Undo');
    expect(
      items()
        .map((i) => i.start)
        .sort()
    ).toEqual([1080, 1200]);
  });

  it('flags overlaps', async () => {
    useRunOfShowStore.getState().addItem({ title: 'Dinner', start: 1080, durationMin: 90 });
    useRunOfShowStore.getState().addItem({ title: 'Speeches', start: 1140 });
    const tree = await renderWithProviders(<RunOfShowScreen />);
    expect(shownTexts(tree)).toContain('Speeches starts before Dinner ends (7:30 PM)');
  });

  it('gives each event its own run of show', async () => {
    const mehndi = useEventStore.getState().addEvent({ kind: 'mehndi', date: '2030-05-07' });
    useRunOfShowStore.getState().addItem({ title: 'Ceremony', start: 960 });
    const tree = await renderWithProviders(<RunOfShowScreen />);
    await press(tree, 'Mehndi');
    expect(shownTexts(tree)).not.toContain('Ceremony');
    await press(tree, 'Add the first item');
    await type(tree, 'What', 'Henna for the bride');
    await type(tree, 'Starts', '5pm');
    await press(tree, 'Add');
    expect(itemsForDay(items(), mehndi.id).map((i) => i.title)).toEqual(['Henna for the bride']);

    await press(tree, 'Share');
    expect(mockShare.mock.calls[0][0]).toMatch(/^Priya and Sam's wedding - Mehndi - run of show/);
  });

  it('clears only the chosen day, after confirming', async () => {
    const mehndi = useEventStore.getState().addEvent({ kind: 'mehndi' });
    useRunOfShowStore.getState().addItem({ title: 'Ceremony', start: 960 });
    useRunOfShowStore.getState().addItem({ title: 'Henna', start: 1020, eventId: mehndi.id });
    const tree = await renderWithProviders(<RunOfShowScreen initialEventId={mehndi.id} />);
    await press(tree, 'Clear');
    expect(items()).toHaveLength(2);
    expect(pressables(tree, 'Clear').length).toBeGreaterThan(1);
    await press(tree, 'Clear', pressables(tree, 'Clear').length - 1);
    expect(items().map((i) => i.title)).toEqual(['Ceremony']);
  });
});
