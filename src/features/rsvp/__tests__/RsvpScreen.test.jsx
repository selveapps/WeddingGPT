import React from 'react';

import { useAuthStore, useGuestStore, useRsvpStore, useWeddingStore } from '@/store';
import { createGuest, createHousehold, createWedding } from '@/models';
import { press, renderWithProviders, shownTexts } from '@/test/render';

import { RsvpScreen } from '../RsvpScreen';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

let mockActive = 'ws_1';
jest.mock('@/features/sync/useActiveWorkspace', () => ({ useActiveWorkspace: () => mockActive }));
jest.mock('@/services/sync', () => ({
  isSyncConfigured: true,
  SyncErrorCode: { SLUG_TAKEN: 'slug_taken' },
}));

const mockApi = {
  getSettings: jest.fn(),
  listInvites: jest.fn(),
  saveSettings: jest.fn(),
  createInvites: jest.fn(),
  revoke: jest.fn(),
};
jest.mock('@/services/rsvp', () => ({
  get rsvpApi() {
    return mockApi;
  },
}));

let household;
beforeEach(() => {
  jest.clearAllMocks();
  mockActive = 'ws_1';
  useAuthStore.setState({ status: 'signedIn', token: 'tok', user: { id: 'u1' } });
  useGuestStore.getState().reset();
  useRsvpStore.getState().reset();
  const wedding = createWedding({ ownerName: 'Priya', partnerName: 'Sam' });
  useWeddingStore.setState({ wedding });
  household = useGuestStore
    .getState()
    .addHousehold(createHousehold({ weddingId: wedding.id, name: 'The Shahs' }));
  useGuestStore
    .getState()
    .addGuest(createGuest({ weddingId: wedding.id, firstName: 'Meera', householdId: household.id }));
  mockApi.getSettings.mockResolvedValue(null);
  mockApi.listInvites.mockResolvedValue([]);
});

const render = () => renderWithProviders(<RsvpScreen />);

describe('RsvpScreen', () => {
  it('asks to sync first when the wedding is only on this phone', async () => {
    mockActive = 'local';
    const tree = await render();
    expect(shownTexts(tree)).toContain('Let guests reply online');
    await press(tree, 'Go to Account');
    expect(mockRouter.push).toHaveBeenCalledWith('/account');
  });

  it('suggests a page address and saves the settings', async () => {
    mockApi.saveSettings.mockResolvedValue({ slug: 'priya-and-sam', deadline: null, questions: {} });
    const tree = await render();
    const slugField = tree.root.find((n) => n.props.label === 'Page address' && n.props.onChangeText);
    expect(slugField.props.value).toBe('priya-and-sam');
    await press(tree, 'Save the page');
    expect(mockApi.saveSettings).toHaveBeenCalledWith(expect.objectContaining({ slug: 'priya-and-sam' }));
  });

  it('explains a taken page address', async () => {
    mockApi.saveSettings.mockRejectedValue(Object.assign(new Error('taken'), { code: 'slug_taken' }));
    const tree = await render();
    await press(tree, 'Save the page');
    expect(shownTexts(tree)).toContain(
      'Another wedding already uses that page address. Try a different one.'
    );
  });

  it('creates links for invitations without one and keeps them on this phone', async () => {
    const invite = {
      inviteId: 'inv_1',
      targetType: 'household',
      targetId: household.id,
      url: 'https://rsvp.example.com/r/tok',
      code: 'ABCD-EFGH',
    };
    mockApi.createInvites.mockResolvedValue([invite]);
    const tree = await render();
    expect(shownTexts(tree)).toContain('No link yet');

    mockApi.listInvites.mockResolvedValue([
      { id: 'inv_1', targetType: 'household', targetId: household.id, revoked: false },
    ]);
    await press(tree, 'Create links for 1 invitation');
    expect(mockApi.createInvites).toHaveBeenCalledWith([{ type: 'household', id: household.id }]);
    expect(useRsvpStore.getState().links.inv_1).toMatchObject({ code: 'ABCD-EFGH' });
    expect(shownTexts(tree)).toContain('Code ABCD-EFGH · tap to send');
  });

  it('lists replies newest first', async () => {
    useRsvpStore.setState({
      responses: {
        byId: {
          r1: {
            id: 'r1',
            targetType: 'household',
            targetId: household.id,
            submittedAt: '2027-03-01T00:00:00.000Z',
            guests: [{ guestId: 'x', attending: true }],
            message: 'So happy!',
          },
        },
        allIds: ['r1'],
      },
    });
    const tree = await render();
    expect(shownTexts(tree)).toContain('1 coming · "So happy!"');
  });
});
