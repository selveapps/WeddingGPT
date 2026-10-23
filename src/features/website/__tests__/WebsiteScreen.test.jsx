import React from 'react';

import { useAuthStore, useWebsiteStore, useWeddingStore } from '@/store';
import { createWedding } from '@/models';
import { act, press, renderWithProviders, shownTexts } from '@/test/render';

import { WebsiteScreen } from '../WebsiteScreen';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

let mockActive = 'ws_1';
jest.mock('@/features/sync/useActiveWorkspace', () => ({ useActiveWorkspace: () => mockActive }));
jest.mock('@/services/sync', () => ({ isSyncConfigured: true }));

const mockApi = { getSiteSettings: jest.fn(), getSettings: jest.fn(), saveSiteSettings: jest.fn() };
jest.mock('@/services/rsvp', () => ({
  get rsvpApi() {
    return mockApi;
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockActive = 'ws_1';
  useAuthStore.setState({ status: 'signedIn', token: 'tok', user: { id: 'u1' } });
  useWebsiteStore.getState().reset();
  useWeddingStore.setState({ wedding: createWedding({ ownerName: 'Priya', partnerName: 'Sam' }) });
  mockApi.getSettings.mockResolvedValue({ slug: 'priya-and-sam' });
  mockApi.getSiteSettings.mockResolvedValue({ visibility: 'off', indexable: false, hasPassword: false });
});

const render = () => renderWithProviders(<WebsiteScreen />);
const field = (tree, label) =>
  tree.root.find((n) => n.props.label === label && typeof n.props.onChangeText === 'function');

describe('WebsiteScreen', () => {
  it('creates the website and saves the welcome as it is typed', async () => {
    const tree = await render();
    await act(async () => field(tree, 'Headline').props.onChangeText('We are getting married'));
    expect(useWebsiteStore.getState().website.welcome.title).toBe('We are getting married');
  });

  it('adds a schedule item through the sheet', async () => {
    const tree = await render();
    await press(tree, 'Add to the schedule');
    await act(async () => field(tree, 'What').props.onChangeText('Ceremony'));
    await act(async () => field(tree, 'Place').props.onChangeText('Rose Garden'));
    await press(tree, 'Save');
    expect(useWebsiteStore.getState().website.events.map((e) => [e.name, e.place])).toEqual([
      ['Ceremony', 'Rose Garden'],
    ]);
    expect(shownTexts(tree)).toContain('Ceremony');
  });

  it('refuses a registry link that is not https', async () => {
    const tree = await render();
    await press(tree, 'Add a registry link');
    await act(async () => field(tree, 'Registry').props.onChangeText('Gifts'));
    await act(async () => field(tree, 'Link').props.onChangeText('javascript:alert(1)'));
    await press(tree, 'Save');
    expect(shownTexts(tree)).toContain('Links start with https://');
    expect(useWebsiteStore.getState().website.registry).toEqual([]);
  });

  it('publishes through the server settings', async () => {
    mockApi.saveSiteSettings.mockResolvedValue({
      visibility: 'public',
      indexable: false,
      hasPassword: false,
    });
    const tree = await render();
    const control = tree.root.find((n) => Array.isArray(n.props.options) && n.props.onChange);
    await act(async () => control.props.onChange('public'));
    expect(mockApi.saveSiteSettings).toHaveBeenCalledWith({ visibility: 'public' });
  });

  it('asks for a password before going password-only', async () => {
    const tree = await render();
    const control = tree.root.find((n) => Array.isArray(n.props.options) && n.props.onChange);
    await act(async () => control.props.onChange('password'));
    expect(mockApi.saveSiteSettings).not.toHaveBeenCalled();
    expect(shownTexts(tree)).toContain('Set a password of at least 6 characters first.');

    mockApi.saveSiteSettings.mockResolvedValue({
      visibility: 'password',
      indexable: false,
      hasPassword: true,
    });
    await act(async () => field(tree, 'Password for guests').props.onChangeText('garden2027'));
    await act(async () => control.props.onChange('password'));
    expect(mockApi.saveSiteSettings).toHaveBeenCalledWith({ visibility: 'password', password: 'garden2027' });
  });

  it('sends couples to RSVP when the page address is not set', async () => {
    mockApi.getSettings.mockResolvedValue(null);
    const tree = await render();
    await press(tree, 'Set the address');
    expect(mockRouter.push).toHaveBeenCalledWith('/guests/rsvp');
  });

  it('lets couples write before the wedding is synced', async () => {
    mockActive = 'local';
    const tree = await render();
    expect(shownTexts(tree)).toContain('Write it now, publish when you are ready');
    expect(mockApi.getSiteSettings).not.toHaveBeenCalled();
    await act(async () => field(tree, 'Headline').props.onChangeText('Draft'));
    expect(useWebsiteStore.getState().website.welcome.title).toBe('Draft');
  });
});
