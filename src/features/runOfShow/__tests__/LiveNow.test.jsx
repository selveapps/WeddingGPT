import React from 'react';
import { Linking } from 'react-native';

import { usePartyStore, useRunOfShowStore, useVendorStore, useWeddingStore, selectRunOfShow } from '@/store';
import { createWedding } from '@/models';
import { useFlagStore } from '@/services/flags';
import { act, press, renderWithProviders, shownTexts } from '@/test/render';

import { RunOfShowScreen } from '../RunOfShowScreen';

jest.mock('@/services/share', () => ({ shareText: jest.fn(async () => true) }));

const items = () => selectRunOfShow(useRunOfShowStore.getState());
const startOf = (title) => items().find((item) => item.title === title).start;

// Each test sets the clock on this day; most at 4:10 PM.
const WEDDING_DAY = '2027-02-14';
const setClock = (hours, minutes) =>
  jest.useFakeTimers({
    now: new Date(2027, 1, 14, hours, minutes),
    doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'],
  });

beforeEach(() => {
  jest.clearAllMocks();
  setClock(16, 10);
  useRunOfShowStore.getState().reset();
  useRunOfShowStore.setState({ labsImportedAt: 'done' });
  useVendorStore.getState().reset();
  usePartyStore.getState().reset();
  useWeddingStore.setState({
    wedding: createWedding({ ownerName: 'Priya', partnerName: 'Sam', date: WEDDING_DAY }),
  });
  const { addItem } = useRunOfShowStore.getState();
  addItem({ title: 'Ceremony', start: 960, durationMin: 30, owner: 'Officiant' });
  addItem({ title: 'Cocktail hour', start: 990, durationMin: 60, owner: 'Caterer' });
  addItem({ title: 'Dinner', start: 1080, durationMin: 90, owner: 'Caterer' });
});

afterEach(() => jest.useRealTimers());

describe('Live mode on the day', () => {
  it('shows what is on now and what is next', async () => {
    const tree = await renderWithProviders(<RunOfShowScreen />);
    const texts = shownTexts(tree);
    expect(texts).toEqual(expect.arrayContaining(['Live', 'Now', 'Next', 'Cocktail hour']));
    expect(texts).toContain('Today · 4:10 PM · 0 of 3 done');
    expect(texts).toContain('4:30 PM, in 20m · Caterer');
  });

  it('moves everything still to come when running late, with undo', async () => {
    const tree = await renderWithProviders(<RunOfShowScreen />);
    await press(tree, 'Move Cocktail hour and everything after it 10 minutes later');
    expect([startOf('Ceremony'), startOf('Cocktail hour'), startOf('Dinner')]).toEqual([960, 1000, 1090]);
    expect(shownTexts(tree)).toContain('Moved 2 items later');
  });

  it('calls the booked vendor who runs what is next', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    useVendorStore.getState().addVendor({
      name: 'Saffron Kitchen',
      categoryKey: 'catering',
      status: 'booked',
      phone: '555 0102',
    });
    const tree = await renderWithProviders(<RunOfShowScreen />);
    expect(shownTexts(tree)).toContain('Who to call today');
    await press(tree, 'Call Saffron Kitchen');
    expect(openURL).toHaveBeenCalledWith('tel:5550102');
  });

  it('counts down before the day starts, without the late buttons', async () => {
    setClock(9, 0);
    const tree = await renderWithProviders(<RunOfShowScreen />);
    const texts = shownTexts(tree);
    expect(texts).toEqual(expect.arrayContaining(['First up', '4:00 PM, in 7h · Officiant']));
    expect(texts).not.toContain('Running late?');
  });

  it('is not shown with its flag off', async () => {
    await act(async () => useFlagStore.getState().setOverride('liveMode', false));
    const tree = await renderWithProviders(<RunOfShowScreen />);
    expect(shownTexts(tree)).not.toContain('Live');
    await act(async () => useFlagStore.getState().clearOverrides());
  });

  it('is not shown on any other day', async () => {
    useWeddingStore.setState({
      wedding: createWedding({ ownerName: 'Priya', partnerName: 'Sam', date: '2027-03-01' }),
    });
    const tree = await renderWithProviders(<RunOfShowScreen />);
    expect(shownTexts(tree)).not.toContain('Live');
  });
});
