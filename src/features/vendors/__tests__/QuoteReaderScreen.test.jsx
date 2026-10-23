import React from 'react';

import { useVendorStore, useWeddingStore } from '@/store';
import { SAMPLE_QUOTE, VendorStatus, createWedding } from '@/models';
import { act, press, pressables, renderWithProviders, shownTexts } from '@/test/render';

import { QuoteReaderScreen } from '../QuoteReaderScreen';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
const mockShare = jest.fn(async () => true);
jest.mock('@/services/share', () => ({ shareText: (...args) => mockShare(...args) }));

const vendors = () => Object.values(useVendorStore.getState().vendors.byId);
const paste = (tree, text) =>
  act(async () =>
    tree.root
      .find((n) => n.props.label === 'Paste the quote' && typeof n.props.onChangeText === 'function')
      .props.onChangeText(text)
  );

let wedding;
beforeEach(() => {
  jest.clearAllMocks();
  useVendorStore.getState().reset();
  wedding = createWedding({ ownerName: 'Priya' });
  useWeddingStore.setState({ wedding });
});

describe('QuoteReaderScreen', () => {
  it('reads the numbers, dates and fine print from a pasted quote', async () => {
    const tree = await renderWithProviders(<QuoteReaderScreen />);
    await press(tree, 'Try a sample quote');
    const texts = shownTexts(tree);
    expect(texts).toEqual(expect.arrayContaining(['Rosewood Florals', '$3,700', 'Deposit (30%)', '$1,110']));
    expect(texts).toEqual(expect.arrayContaining(['Non-refundable money', 'Cancellation terms']));
    expect(vendors()).toEqual([]);
  });

  it('says so when it finds nothing', async () => {
    const tree = await renderWithProviders(<QuoteReaderScreen />);
    await paste(tree, 'Thanks for getting in touch!');
    expect(shownTexts(tree).some((t) => t.startsWith('No prices or dates found yet'))).toBe(true);
  });

  it('saves a new vendor only once a category is picked', async () => {
    const tree = await renderWithProviders(<QuoteReaderScreen />);
    await paste(tree, SAMPLE_QUOTE);
    const save = pressables(tree, 'Save to my vendors')[0];
    expect(save.props.disabled ?? save.props.accessibilityState?.disabled).toBe(true);

    await press(tree, 'Florals and decor');
    await press(tree, 'Save to my vendors');
    const [saved] = vendors();
    expect(saved).toMatchObject({
      name: 'Rosewood Florals',
      weddingId: wedding.id,
      categoryKey: 'florals',
      status: VendorStatus.QUOTED,
      quotedAmount: 370000,
      quoteValidUntil: '2027-01-31',
    });
    expect(saved.payments).toHaveLength(2);
    expect(mockRouter.replace).toHaveBeenCalledWith(`/vendors/${saved.id}`);
  });

  it('saves to the vendor it was opened from, asking before replacing unpaid payments', async () => {
    const florist = useVendorStore.getState().addVendor({
      weddingId: wedding.id,
      name: 'Rosewood',
      categoryKey: 'florals',
      status: VendorStatus.CONTACTED,
      payments: [{ id: 'old', label: 'Old estimate', amount: 1000, dueDate: '2027-01-01', paidAt: null }],
    });
    const tree = await renderWithProviders(<QuoteReaderScreen vendorId={florist.id} />);
    await paste(tree, SAMPLE_QUOTE);
    await press(tree, "Save as Rosewood's quote");
    expect(shownTexts(tree)).toContain('Replace the payment plan?');
    expect(useVendorStore.getState().vendors.byId[florist.id].quotedAmount ?? null).toBeNull();

    await press(tree, 'Replace');
    const updated = useVendorStore.getState().vendors.byId[florist.id];
    expect(updated).toMatchObject({ quotedAmount: 370000, status: VendorStatus.QUOTED, name: 'Rosewood' });
    expect(updated.payments.map((p) => p.label)).toEqual(['Deposit', 'Final balance']);
    expect(vendors()).toHaveLength(1);
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('shares a summary', async () => {
    const tree = await renderWithProviders(<QuoteReaderScreen />);
    await paste(tree, SAMPLE_QUOTE);
    await press(tree, 'Share summary');
    expect(mockShare.mock.calls[0][0]).toMatch(/^Rosewood Florals - quote summary/);
  });
});
