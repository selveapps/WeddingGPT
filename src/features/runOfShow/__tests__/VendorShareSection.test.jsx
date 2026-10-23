import React from 'react';

import { useAuthStore, usePartyStore } from '@/store';
import { act, press, pressables, renderWithProviders, shownTexts } from '@/test/render';

import { VendorShareSection } from '../VendorShareSection';

const mockApi = { listDaySheets: jest.fn(), createDaySheet: jest.fn(), revokeDaySheet: jest.fn() };
jest.mock('@/services/rsvp', () => ({
  get rsvpApi() {
    return mockApi;
  },
}));
jest.mock('@/services/sync', () => ({ isSyncConfigured: true }));
let mockActive = 'ws_1';
jest.mock('@/features/sync/useActiveWorkspace', () => ({ useActiveWorkspace: () => mockActive }));
const mockShare = jest.fn(async () => true);
jest.mock('@/services/share', () => ({ shareText: (...args) => mockShare(...args) }));

const flush = () => act(async () => {});

let maya;
beforeEach(() => {
  jest.clearAllMocks();
  mockActive = 'ws_1';
  useAuthStore.setState({ status: 'signedIn', token: 'tok', user: { id: 'u1' } });
  usePartyStore.getState().reset();
  maya = usePartyStore.getState().addMember({ name: 'Maya', roleKey: 'maid_of_honor', phone: '+1 555 0101' });
  usePartyStore.getState().addMember({ name: 'No phone', roleKey: 'usher' });
  mockApi.listDaySheets.mockResolvedValue([]);
  mockApi.createDaySheet.mockResolvedValue({ sheet: { id: 's1' }, url: 'https://rsvp.example.com/d/abc' });
  mockApi.revokeDaySheet.mockResolvedValue();
});

const render = async (props = { eventId: 'ev_1', dayName: 'the mehndi' }) => {
  const tree = await renderWithProviders(<VendorShareSection {...props} />);
  await flush();
  return tree;
};

describe('VendorShareSection', () => {
  it('asks to sync first when the wedding is only on this phone', async () => {
    mockActive = 'local';
    const tree = await render();
    expect(shownTexts(tree).some((t) => t.startsWith('Sync your wedding'))).toBe(true);
    expect(mockApi.listDaySheets).not.toHaveBeenCalled();
  });

  it('makes a link for a vendor with the contacts ticked, and shares it', async () => {
    const tree = await render();
    await press(tree, 'Share with a vendor');
    // Only members with a phone number can be a day-of contact.
    expect(pressables(tree, 'Show Maya')).toHaveLength(1);
    expect(pressables(tree, 'Show No phone')).toHaveLength(0);

    const make = pressables(tree, 'Make the link')[0];
    expect(make.props.disabled ?? make.props.accessibilityState?.disabled).toBe(true);
    await act(async () =>
      tree.root
        .find((n) => n.props.label === 'Who is it for?' && n.props.onChangeText)
        .props.onChangeText('Rosewood')
    );
    await press(tree, 'Show Maya');
    await press(tree, 'Make the link');

    expect(mockApi.createDaySheet).toHaveBeenCalledWith({
      eventId: 'ev_1',
      label: 'Rosewood',
      contactIds: [maya.id],
    });
    expect(mockShare).toHaveBeenCalledWith(
      'Here is our day-of plan for the mehndi: https://rsvp.example.com/d/abc',
      'Day-of plan'
    );
    expect(mockApi.listDaySheets).toHaveBeenCalledTimes(2);
  });

  it('lists this event’s live links and turns one off', async () => {
    mockApi.listDaySheets.mockResolvedValue([
      { id: 's1', eventId: 'ev_1', label: 'Rosewood', lastOpenedAt: null, revokedAt: null },
      { id: 's2', eventId: 'ev_1', label: 'Old DJ', lastOpenedAt: null, revokedAt: '2027-01-01T00:00:00Z' },
      { id: 's3', eventId: null, label: 'Photographer', lastOpenedAt: null, revokedAt: null },
    ]);
    const tree = await render();
    const texts = shownTexts(tree);
    expect(texts).toEqual(expect.arrayContaining(['Rosewood', 'Not opened yet']));
    expect(texts).not.toContain('Old DJ');
    expect(texts).not.toContain('Photographer');

    await press(tree, "Turn off Rosewood's link");
    expect(mockApi.revokeDaySheet).toHaveBeenCalledWith('s1');
  });

  it('says so when a link cannot be made', async () => {
    mockApi.createDaySheet.mockRejectedValueOnce(new Error('offline'));
    const tree = await render();
    await press(tree, 'Share with a vendor');
    await act(async () =>
      tree.root
        .find((n) => n.props.label === 'Who is it for?' && n.props.onChangeText)
        .props.onChangeText('Rosewood')
    );
    await press(tree, 'Make the link');
    expect(mockShare).not.toHaveBeenCalled();
    expect(shownTexts(tree).some((t) => t.startsWith('Could not make the link'))).toBe(true);
  });
});
