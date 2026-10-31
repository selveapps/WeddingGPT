import React from 'react';

import { useFlagStore } from '@/services/flags';
import { act, press, renderWithProviders, shownTexts } from '@/test/render';

import { FlagsScreen } from '../FlagsScreen';

const choose = (tree, key, value) =>
  act(async () =>
    tree.root.find((n) => n.props.testID === `flag-${key}` && n.props.onChange).props.onChange(value)
  );

beforeEach(() => act(() => useFlagStore.getState().clearOverrides()));

describe('FlagsScreen', () => {
  it('lists each flag with its value and where it comes from', async () => {
    const tree = await renderWithProviders(<FlagsScreen />);
    expect(shownTexts(tree)).toEqual(
      expect.arrayContaining(['Live mode on the day', 'liveMode · Default', 'Vision board photos'])
    );
  });

  it('overrides a flag on this phone, and resets', async () => {
    const tree = await renderWithProviders(<FlagsScreen />);
    await choose(tree, 'liveMode', 'off');
    expect(useFlagStore.getState().overrides).toEqual({ liveMode: false });
    expect(shownTexts(tree)).toContain('liveMode · Set on this phone');

    await press(tree, 'Reset 1 override');
    expect(useFlagStore.getState().overrides).toEqual({});
  });
});
