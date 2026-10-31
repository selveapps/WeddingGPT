import React from 'react';

import { useSyncStore, useAuthStore } from '@/store';
import { press, renderWithProviders, shownTexts } from '@/test/render';

import { SyncSection } from '../SyncSection';

const mockLink = {
  listAccountWorkspaces: jest.fn(),
  uploadThisWedding: jest.fn(async () => ({ queued: 3 })),
  openAccountWorkspace: jest.fn(async () => ({})),
  listMembers: jest.fn(async () => []),
  removePartner: jest.fn(async () => {}),
  leaveShared: jest.fn(async () => true),
  createInviteLink: jest.fn(async () => ({ url: 'weddinggpt://invite/abc' })),
};
const mockEngine = {
  syncNow: jest.fn(async () => ({ pulled: 0, pending: 0 })),
  restoreConflict: jest.fn(() => true),
};
let mockActive = 'local';

// Getters: the factory runs during imports, before the mocks above exist.
jest.mock('@/services/sync', () => ({
  get workspaceLink() {
    return mockLink;
  },
  get syncEngine() {
    return mockEngine;
  },
}));
jest.mock('../useActiveWorkspace', () => ({ useActiveWorkspace: () => mockActive }));

const render = () => renderWithProviders(<SyncSection />);
const texts = shownTexts;

beforeEach(() => {
  jest.clearAllMocks();
  mockActive = 'local';
  useSyncStore.getState().reset();
});

describe('SyncSection on the phone’s own wedding', () => {
  it('offers to back up when the account has no wedding', async () => {
    mockLink.listAccountWorkspaces.mockResolvedValue([]);
    const tree = await render();
    expect(texts(tree)).toContain('Back up and sync this wedding');
    await press(tree, 'Back up and sync');
    expect(mockLink.uploadThisWedding).toHaveBeenCalledWith('your wedding');
  });

  it("lists the account's weddings and opens one, keeping the phone's own", async () => {
    mockLink.listAccountWorkspaces.mockResolvedValue([
      { id: 'ws_1', name: 'Priya and Sam', role: 'partner' },
    ]);
    const tree = await render();
    expect(texts(tree)).toContain(
      'The wedding on this phone stays as it is. You will see it again if you sign out.'
    );
    await press(tree, 'Open Priya and Sam');
    expect(mockLink.openAccountWorkspace).toHaveBeenCalledWith({
      id: 'ws_1',
      name: 'Priya and Sam',
      role: 'partner',
    });
  });

  it('shows a retry when the account cannot be reached', async () => {
    mockLink.listAccountWorkspaces.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
    const tree = await render();
    expect(texts(tree)).toContain('Could not reach your account to check for a shared wedding.');
    await press(tree, 'Try again');
    expect(texts(tree)).toContain('Back up and sync this wedding');
  });
});

describe('SyncSection on a synced wedding', () => {
  beforeEach(() => {
    mockActive = 'ws_1';
  });

  it('shows the status and syncs on request', async () => {
    useSyncStore.getState().enqueue([{ collection: 'tasks', id: 't1', op: 'upsert', data: { id: 't1' } }]);
    const tree = await render();
    expect(texts(tree)).toContain('1 change waiting to sync');
    await press(tree, 'Sync now');
    expect(mockEngine.syncNow).toHaveBeenCalled();
  });

  it('lists conflicts with restore and keep options', async () => {
    useSyncStore.setState({
      conflicts: [
        { id: 'c1', collection: 'tasks', recordId: 't1', overwritten: { data: { title: 'Book venue' } } },
        { id: 'c2', collection: 'guests', recordId: 'g1', overwritten: { data: { firstName: 'Jo' } } },
      ],
    });
    const tree = await render();
    expect(texts(tree)).toContain('A task (Book venue) was also changed on another phone. Yours was kept.');

    await press(tree, 'Restore the other version', 0);
    expect(mockEngine.restoreConflict).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1' }));

    await press(tree, 'Keep mine', 1);
    expect(useSyncStore.getState().conflicts.map((c) => c.id)).toEqual(['c1']);
  });
});

describe('MembersCard, inside a synced wedding', () => {
  const owner = { userId: 'user_priya', name: 'Priya', role: 'owner' };
  const partner = { userId: 'user_sam', name: 'Sam', role: 'partner' };

  beforeEach(() => {
    mockActive = 'ws_1';
  });

  function signInAs(id) {
    useAuthStore.setState({ status: 'signedIn', token: 'tok', user: { id, email: `${id}@example.com` } });
  }

  it('lets the owner invite while there is room', async () => {
    signInAs('user_priya');
    mockLink.listMembers.mockResolvedValue([owner]);
    const tree = await render();
    expect(texts(tree)).toContain('Priya (you)');
    await press(tree, 'Invite your partner');
    expect(texts(tree)).toContain('Create a secure link and share it with the person planning alongside you.');
  });

  it('lets the owner remove the partner, after confirming', async () => {
    signInAs('user_priya');
    mockLink.listMembers.mockResolvedValue([owner, partner]);
    const tree = await render();
    expect(texts(tree)).toContain('Tap your partner to remove them from this wedding.');
    await press(tree, 'Sam');
    expect(texts(tree)).toContain('Remove Sam?');
    await press(tree, 'Remove');
    expect(mockLink.removePartner).toHaveBeenCalledWith('user_sam');
  });

  it('lets a partner leave, and does not offer invites', async () => {
    signInAs('user_sam');
    mockLink.listMembers.mockResolvedValue([owner, partner]);
    const tree = await render();
    expect(texts(tree)).not.toContain('Invite your partner');
    await press(tree, 'Leave this wedding');
    await press(tree, 'Leave');
    expect(mockLink.leaveShared).toHaveBeenCalledWith('user_sam');
  });
});
