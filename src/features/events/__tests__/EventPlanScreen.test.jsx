import React from 'react';

import { useEventStore, useGuestStore, useRunOfShowStore, useWeddingStore } from '@/store';
import { createGuest, createWedding, RsvpStatus } from '@/models';
import { press, renderWithProviders, shownTexts } from '@/test/render';

import { EventPlanScreen } from '../EventPlanScreen';

const mockRouter = { push: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

const mockPrint = jest.fn(async () => 'shared');
jest.mock('@/services/files', () => ({
  CAN_PRINT: false,
  printPage: (...args) => mockPrint(...args),
}));

let mehndi;
beforeEach(() => {
  jest.clearAllMocks();
  useEventStore.getState().reset();
  useGuestStore.getState().reset();
  useRunOfShowStore.getState().reset();
  const wedding = createWedding({ ownerName: 'Priya', partnerName: 'Sam' });
  useWeddingStore.setState({ wedding });
  const ana = createGuest({ weddingId: wedding.id, firstName: 'Ana', rsvpStatus: RsvpStatus.ATTENDING });
  useGuestStore.getState().addGuest(ana);
  mehndi = useEventStore.getState().addEvent({
    weddingId: wedding.id,
    kind: 'mehndi',
    date: '2027-02-12',
    venueName: 'The Rose Garden',
    guestScope: 'invited',
    invitedGuestIds: [ana.id],
  });
  useRunOfShowStore
    .getState()
    .addItem({ weddingId: wedding.id, eventId: mehndi.id, title: 'Henna', start: 1020 });
});

describe('EventPlanScreen', () => {
  it("shows the chosen event's plan and shares it as text on a phone", async () => {
    const tree = await renderWithProviders(<EventPlanScreen initialEventId={mehndi.id} />);
    expect(shownTexts(tree)).toEqual(expect.arrayContaining(['Mehndi', 'Henna']));

    await press(tree, 'Share the plan');
    const [page] = mockPrint.mock.calls[0];
    expect(page.title).toBe('Mehndi');
    expect(page.text).toContain("Priya and Sam's wedding");
    expect(page.text).toContain('Henna');
    expect(page.html).toContain('<h1>Mehndi</h1>');
  });

  it('switches to the wedding day, and says when there is nothing to print', async () => {
    useGuestStore.getState().reset();
    const tree = await renderWithProviders(<EventPlanScreen initialEventId={mehndi.id} />);
    await press(tree, 'The wedding day');
    expect(shownTexts(tree)).toContain('Nothing to print yet');
    await press(tree, 'Plan the run of show');
    expect(mockRouter.push).toHaveBeenCalledWith('/planning/run-of-show');
  });
});
