import React from 'react';

import { useAuthStore, useWeddingStore } from '@/store';
import { SyncError } from '@/services/sync/syncClient';
import { press, renderWithProviders, shownTexts } from '@/test/render';

import { JoinWeddingScreen } from '../JoinWeddingScreen';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ token: 'invite-token-123' }),
}));

const mockLink = { joinWithInvite: jest.fn() };
jest.mock('@/services/sync', () => ({
  isSyncConfigured: true,
  get workspaceLink() {
    return mockLink;
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  useWeddingStore.setState({ wedding: null });
});

const render = () => renderWithProviders(<JoinWeddingScreen />);

describe('JoinWeddingScreen', () => {
  it('asks a signed-out partner to sign in or create an account', async () => {
    useAuthStore.setState({ status: 'signedOut', token: null, user: null });
    const tree = await render();
    expect(shownTexts(tree)).toContain(
      'Sign in, or create a free account, to join. You will come straight back here.'
    );
    await press(tree, 'Create an account');
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/account/sign-in',
      params: { mode: 'signUp' },
    });
  });

  it('joins with the token from the link and goes to Home', async () => {
    useAuthStore.setState({ status: 'signedIn', token: 'tok', user: { id: 'user_sam' } });
    mockLink.joinWithInvite.mockResolvedValue({ id: 'ws_1', name: 'Priya and Sam' });
    const tree = await render();
    await press(tree, 'Join the wedding');
    expect(mockLink.joinWithInvite).toHaveBeenCalledWith('invite-token-123');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/home');
  });

  it('reassures when the phone already has a wedding, and explains a used-up link', async () => {
    useAuthStore.setState({ status: 'signedIn', token: 'tok', user: { id: 'user_sam' } });
    useWeddingStore.setState({ wedding: { id: 'wed_mine' } });
    mockLink.joinWithInvite.mockRejectedValue(new SyncError('invite_invalid'));
    const tree = await render();
    expect(shownTexts(tree)).toContain(
      'What you have already planned on this phone stays as it is. You will see it again if you sign out.'
    );
    await press(tree, 'Join the wedding');
    expect(shownTexts(tree)).toContain(
      'This invite link has expired or was already used. Ask your partner to send a new one.'
    );
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
