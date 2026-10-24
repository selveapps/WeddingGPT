import React from 'react';

import { VendorStatus } from '@/models';
import { useVendorStore } from '@/store/vendorStore';
import { act, press, renderWithProviders, shownTexts } from '@/test/render';

import { VendorCompareScreen } from '../VendorCompareScreen';

const mockShareText = jest.fn(async () => true);
jest.mock('@/services/share', () => ({ shareText: (...args) => mockShareText(...args) }));

const renderedTrees = [];

beforeEach(async () => {
  jest.clearAllMocks();
  await act(async () => {
    useVendorStore.getState().reset();
    const addVendor = useVendorStore.getState().addVendor;
    addVendor({
      name: 'Willow Photo',
      categoryKey: 'photography',
      status: VendorStatus.QUOTED,
      quotedAmount: 250000,
      quoteScope: 'Full day, two photographers',
    });
    addVendor({
      name: 'Light House',
      categoryKey: 'photography',
      status: VendorStatus.MEETING_SCHEDULED,
      quotedAmount: 300000,
      quoteScope: 'Full day, one photographer',
    });
    addVendor({ name: 'Garden Venue', categoryKey: 'venue', status: VendorStatus.SAVED });
    addVendor({ name: 'Lakeside Venue', categoryKey: 'venue', status: VendorStatus.SAVED });
  });
});

afterEach(async () => {
  for (const tree of renderedTrees.splice(0)) {
    await act(async () => tree.unmount());
  }
});

describe('VendorCompareScreen', () => {
  it('compares two vendors and shares their quote details', async () => {
    const tree = await renderWithProviders(<VendorCompareScreen />);
    renderedTrees.push(tree);

    await press(tree, 'Photography');
    await press(tree, 'Willow Photo');
    await press(tree, 'Light House');

    expect(
      tree.root.find((node) => node.props.accessibilityLabel === 'Photography').props.accessibilityState
        .checked
    ).toBe(true);
    expect(
      tree.root.find((node) => node.props.accessibilityLabel === 'Willow Photo').props.accessibilityState
        .checked
    ).toBe(true);

    expect(shownTexts(tree)).toEqual(
      expect.arrayContaining([
        'Side-by-side',
        'Willow Photo quoted $500 less',
        '$2,500',
        '$3,000',
        'Full day, two photographers',
        'Full day, one photographer',
      ])
    );

    await press(tree, 'Share comparison');
    expect(mockShareText).toHaveBeenCalledWith(
      expect.stringContaining('Photography comparison'),
      'Vendor comparison'
    );
  });

  it('limits the selection to two vendors and clears it when the category changes', async () => {
    await act(async () => {
      useVendorStore.getState().addVendor({
        name: 'Third Photographer',
        categoryKey: 'photography',
        status: VendorStatus.SAVED,
      });
    });
    const tree = await renderWithProviders(<VendorCompareScreen />);
    renderedTrees.push(tree);

    await press(tree, 'Photography');
    await press(tree, 'Willow Photo');
    await press(tree, 'Light House');
    const third = tree.root.find((node) => node.props.accessibilityLabel === 'Third Photographer');
    expect(third.props.disabled ?? third.props.accessibilityState?.disabled).toBe(true);

    await press(tree, 'Venues');
    expect(shownTexts(tree)).toContain('0 of 2 selected');
    expect(shownTexts(tree)).not.toContain('Side-by-side');
  });
});
