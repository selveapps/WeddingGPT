import React from 'react';

import { useAuthStore } from '@/store';
import { AuthError, AuthErrorCode } from '@/services/auth';
import { act, press, pressables, renderWithProviders, shownTexts } from '@/test/render';

import { AccountDataSection } from '../AccountDataSection';

const mockExport = jest.fn(async () => 'downloaded');
jest.mock('@/services/files', () => ({
  datedFilename: (stem, ext) => `${stem}-2027-01-04.${ext}`,
  exportTextFile: (...args) => mockExport(...args),
}));
const mockLink = { isLinked: jest.fn(() => true), leave: jest.fn(async () => true) };
jest.mock('@/services/sync', () => ({
  get workspaceLink() {
    return mockLink;
  },
}));

const passwordField = (tree) =>
  tree.root.find((n) => n.props.label === 'Your password' && typeof n.props.onChangeText === 'function');

let exportAccount;
let deleteAccount;
beforeEach(() => {
  jest.clearAllMocks();
  exportAccount = jest.fn(async () => ({ user: { id: 'u1' }, workspaces: [] }));
  deleteAccount = jest.fn(async () => {});
  useAuthStore.setState({
    status: 'signedIn',
    token: 'tok',
    user: { id: 'u1' },
    exportAccount,
    deleteAccount,
  });
});

const render = () => renderWithProviders(<AccountDataSection />);

describe('AccountDataSection', () => {
  it('downloads the export as a JSON file', async () => {
    const tree = await render();
    await press(tree, 'Export my data');
    const [file] = mockExport.mock.calls[0];
    expect(file).toMatchObject({
      filename: 'weddinggpt-account-2027-01-04.json',
      mimeType: 'application/json',
    });
    expect(JSON.parse(file.text)).toEqual({ user: { id: 'u1' }, workspaces: [] });
    expect(shownTexts(tree)).toContain('Your data is downloaded');
  });

  it('says why an export failed', async () => {
    exportAccount.mockRejectedValueOnce(new AuthError(AuthErrorCode.OFFLINE));
    useAuthStore.setState({ exportAccount });
    const tree = await render();
    await press(tree, 'Export my data');
    expect(mockExport).not.toHaveBeenCalled();
    expect(shownTexts(tree).some((t) => /offline/.test(t))).toBe(true);
  });

  it('needs the password before it deletes anything', async () => {
    const tree = await render();
    await press(tree, 'Delete my account');
    expect(shownTexts(tree)).toContain('This cannot be undone.');
    const button = pressables(tree, 'Delete my account').at(-1);
    expect(button.props.disabled ?? button.props.accessibilityState?.disabled).toBe(true);
    expect(deleteAccount).not.toHaveBeenCalled();
  });

  it('deletes with the password, then takes the synced wedding off the phone', async () => {
    const tree = await render();
    await press(tree, 'Delete my account');
    await act(async () => passwordField(tree).props.onChangeText('a good password'));
    await press(tree, 'Delete my account', pressables(tree, 'Delete my account').length - 1);
    expect(deleteAccount).toHaveBeenCalledWith('a good password');
    expect(mockLink.leave).toHaveBeenCalled();
    expect(shownTexts(tree)).toContain('Your account is deleted. This phone’s own plan is still here.');
  });

  it('a wrong password keeps everything and says so', async () => {
    deleteAccount.mockRejectedValueOnce(new AuthError(AuthErrorCode.INVALID_CREDENTIALS));
    useAuthStore.setState({ deleteAccount });
    const tree = await render();
    await press(tree, 'Delete my account');
    await act(async () => passwordField(tree).props.onChangeText('nope'));
    await press(tree, 'Delete my account', pressables(tree, 'Delete my account').length - 1);
    expect(mockLink.leave).not.toHaveBeenCalled();
    expect(shownTexts(tree)).toContain('That password is not right. Nothing was deleted.');
  });

  it('can be cancelled', async () => {
    const tree = await render();
    await press(tree, 'Delete my account');
    await press(tree, 'Keep my account');
    expect(deleteAccount).not.toHaveBeenCalled();
    expect(shownTexts(tree)).not.toContain('This cannot be undone.');
  });
});
