import React from 'react';

import { useGiftStore, useGuestStore, useWeddingStore, selectGifts } from '@/store';
import { ThankYouStatus, createGuest, createWedding } from '@/models';
import { act, press, pressables, renderWithProviders, shownTexts } from '@/test/render';

import { GiftsScreen } from '../GiftsScreen';

const mockShare = jest.fn(async () => true);
jest.mock('@/services/share', () => ({ shareText: (...args) => mockShare(...args) }));
const mockExport = jest.fn(async () => 'downloaded');
jest.mock('@/services/files', () => ({
  datedFilename: (stem) => `${stem}-2027-01-04.csv`,
  exportTextFile: (...args) => mockExport(...args),
}));

const gifts = () => selectGifts(useGiftStore.getState());
const field = (tree, label) =>
  tree.root.find((n) => n.props.label === label && typeof n.props.onChangeText === 'function');
const type = (tree, label, text) => act(async () => field(tree, label).props.onChangeText(text));

beforeEach(() => {
  jest.clearAllMocks();
  useGiftStore.getState().reset();
  useGiftStore.setState({ labsImportedAt: 'done' });
  useGuestStore.getState().reset();
  useWeddingStore.setState({ wedding: createWedding({ ownerName: 'Priya', partnerName: 'Sam' }) });
});

const render = () => renderWithProviders(<GiftsScreen />);

describe('GiftsScreen', () => {
  it('logs a gift and links it to the guest it came from', async () => {
    const maria = useGuestStore.getState().addGuest(createGuest({ firstName: 'Maria', lastName: 'Lopez' }));
    const tree = await render();
    await press(tree, 'Log a gift');
    await type(tree, 'From', 'mari');
    await press(tree, 'Maria Lopez');
    await type(tree, 'What was it?', 'stand mixer');
    await press(tree, 'Log gift');

    expect(gifts()).toHaveLength(1);
    expect(gifts()[0]).toMatchObject({
      fromName: 'Maria Lopez',
      description: 'stand mixer',
      guestId: maria.id,
    });
    expect(shownTexts(tree)).toContain('0 of 1 thanked');
  });

  it('will not log a gift without a name', async () => {
    const tree = await render();
    await press(tree, 'Log a gift');
    await press(tree, 'Log gift');
    expect(gifts()).toEqual([]);
    expect(shownTexts(tree)).toContain('Who was it from?');
  });

  it('writes the note from a draft, saves it and marks it sent', async () => {
    useGiftStore.getState().addGift({ fromName: 'Maria', description: 'vase' });
    const tree = await render();
    await press(tree, 'Write note');
    const note = field(tree, 'Note');
    expect(note.props.value).toContain('Thank you so much for the vase');
    await type(tree, 'Note', 'Dear Maria, the vase is perfect.');
    await press(tree, 'Share');
    expect(mockShare).toHaveBeenCalledWith('Dear Maria, the vase is perfect.', 'Thank you');
    expect(gifts()[0]).toMatchObject({
      note: 'Dear Maria, the vase is perfect.',
      thankYouStatus: ThankYouStatus.DRAFTED,
    });

    await press(tree, 'Mark as sent');
    expect(gifts()[0].thankYouStatus).toBe(ThankYouStatus.SENT);
    // Thanked gifts leave the "To thank" list.
    expect(shownTexts(tree)).toContain('Every gift is thanked');
  });

  it('marks a gift thanked from the list, with undo', async () => {
    useGiftStore.getState().addGift({ fromName: 'Sam' });
    const tree = await render();
    await press(tree, 'Mark Sam as thanked');
    expect(gifts()[0].thankYouStatus).toBe(ThankYouStatus.SENT);
    await press(tree, 'Undo');
    expect(gifts()[0].thankYouStatus).toBe(ThankYouStatus.TODO);
  });

  it('deletes a gift only after confirming', async () => {
    useGiftStore.getState().addGift({ fromName: 'Sam' });
    const tree = await render();
    await press(tree, 'Edit the gift from Sam');
    await press(tree, 'Delete gift');
    expect(gifts()).toHaveLength(1);
    await press(tree, 'Delete');
    expect(gifts()).toEqual([]);
  });

  it('flags overdue thank-yous and exports the list', async () => {
    useWeddingStore.setState({
      wedding: createWedding({ ownerName: 'Priya', date: '2020-01-01', dateType: 'exact' }),
    });
    useGiftStore.getState().addGift({ fromName: 'Late Larry', receivedOn: '2020-01-01' });
    const tree = await render();
    expect(shownTexts(tree)).toEqual(expect.arrayContaining(['Overdue']));
    expect(shownTexts(tree).some((t) => /1 overdue/.test(t))).toBe(true);

    await press(tree, 'Export as CSV');
    expect(mockExport.mock.calls[0][0]).toMatchObject({ filename: 'gifts-2027-01-04.csv', title: 'Gifts' });
    expect(mockExport.mock.calls[0][0].text).toContain('Late Larry');
  });

  it('shows the empty state first', async () => {
    const tree = await render();
    expect(shownTexts(tree)).toContain('No gifts logged yet');
    expect(pressables(tree, 'Export as CSV')).toHaveLength(0);
  });
});
