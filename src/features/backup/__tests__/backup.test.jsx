import React from 'react';

import {
  useEventStore,
  useGiftStore,
  useGuestStore,
  usePlanningStore,
  useWeddingStore,
  selectAllGuests,
  selectEvents,
  selectGifts,
} from '@/store';
import { createGuest, createWedding } from '@/models';
import { act, press, pressables, renderWithProviders, shownTexts } from '@/test/render';

import {
  BACKUP_SLICES,
  canRestoreHere,
  checkBackup,
  createBackupText,
  restoreBackup,
} from '../backupService';
import { BackupSection } from '../BackupSection';

const mockExport = jest.fn(async () => 'downloaded');
jest.mock('@/services/files', () => ({
  CAN_PICK_FILES: false,
  pickTextFile: jest.fn(),
  datedFilename: (stem, ext) => `${stem}-2027-01-04.${ext}`,
  exportTextFile: (...args) => mockExport(...args),
}));
let mockActive = 'local';
jest.mock('@/services/storage', () => {
  const actual = jest.requireActual('@/services/storage');
  return { ...actual, workspaceStorage: { ...actual.workspaceStorage, getActive: () => mockActive } };
});

const linked = { getActive: () => 'ws_1' };
const local = { getActive: () => 'local' };

function plan() {
  const wedding = createWedding({ ownerName: 'Priya', partnerName: 'Sam' });
  useWeddingStore.setState({ wedding });
  useGuestStore.getState().reset();
  useGuestStore.getState().addGuest(createGuest({ weddingId: wedding.id, firstName: 'Meera' }));
  useEventStore.getState().reset();
  useEventStore.getState().addEvent({ weddingId: wedding.id, kind: 'mehndi' });
  useGiftStore.getState().reset();
  useGiftStore.getState().addGift({ weddingId: wedding.id, fromName: 'Aunt Maria' });
  return wedding;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockActive = 'local';
});

describe('backup service', () => {
  it('covers every collection that syncs, except server-written RSVP replies', () => {
    const collections = BACKUP_SLICES.map((slice) => slice.collection);
    expect(collections).toEqual(
      expect.arrayContaining(['wedding', 'guests', 'events', 'gifts', 'runOfShow', 'packingItems'])
    );
    expect(collections).not.toContain('rsvpResponses');
    expect(BACKUP_SLICES.every((slice) => slice.label && slice.label !== slice.collection)).toBe(true);
  });

  it('puts the plan back exactly, replacing what changed since', () => {
    const wedding = plan();
    const text = createBackupText();

    // After the backup: a guest deleted, a guest added, the gift thanked.
    const [meera] = selectAllGuests(useGuestStore.getState());
    useGuestStore.getState().deleteGuest(meera.id);
    useGuestStore.getState().addGuest(createGuest({ weddingId: wedding.id, firstName: 'Late addition' }));
    useEventStore.getState().reset();

    const checked = checkBackup(text);
    expect(checked.ok).toBe(true);
    expect(restoreBackup(checked, { storage: local })).toBeGreaterThan(3);

    expect(selectAllGuests(useGuestStore.getState()).map((g) => g.firstName)).toEqual(['Meera']);
    expect(selectEvents(useEventStore.getState()).map((e) => e.name)).toEqual(['Mehndi']);
    expect(selectGifts(useGiftStore.getState()).map((g) => g.fromName)).toEqual(['Aunt Maria']);
    expect(useWeddingStore.getState().wedding.id).toBe(wedding.id);
  });

  it('never restores into a synced wedding', () => {
    plan();
    const checked = checkBackup(createBackupText());
    expect(canRestoreHere(linked)).toBe(false);
    expect(() => restoreBackup(checked, { storage: linked })).toThrow();
    expect(() => restoreBackup({ ok: false }, { storage: local })).toThrow();
  });

  it('leaves the stores alone when the backup is refused', () => {
    plan();
    const before = usePlanningStore.getState().tasks;
    expect(checkBackup('{"format":"weddinggpt-backup"}').ok).toBe(false);
    expect(usePlanningStore.getState().tasks).toBe(before);
  });
});

describe('BackupSection', () => {
  const pasteField = (tree) =>
    tree.root.find((n) => n.props.label === 'Paste the backup' && typeof n.props.onChangeText === 'function');

  it('downloads a backup file', async () => {
    plan();
    const tree = await renderWithProviders(<BackupSection />);
    await press(tree, "Back up this phone's plan");
    const [file] = mockExport.mock.calls[0];
    expect(file).toMatchObject({
      filename: 'weddinggpt-backup-2027-01-04.json',
      mimeType: 'application/json',
    });
    expect(checkBackup(file.text).ok).toBe(true);
  });

  it('shows what a backup holds and restores it only on confirm', async () => {
    plan();
    const text = createBackupText({ createdAt: '2027-01-04T10:00:00.000Z' });
    useGuestStore.getState().reset();

    const tree = await renderWithProviders(<BackupSection />);
    await press(tree, 'Restore from a backup');
    const replace = pressables(tree, 'Replace my plan with this backup')[0];
    expect(replace.props.disabled ?? replace.props.accessibilityState?.disabled).toBe(true);

    await act(async () => pasteField(tree).props.onChangeText(text));
    expect(shownTexts(tree)).toEqual(expect.arrayContaining(['Backup from Jan 4, 2027', 'Guests', 'Gifts']));
    expect(selectAllGuests(useGuestStore.getState())).toEqual([]);

    await press(tree, 'Replace my plan with this backup');
    expect(selectAllGuests(useGuestStore.getState()).map((g) => g.firstName)).toEqual(['Meera']);
  });

  it('says why a file cannot be restored', async () => {
    const tree = await renderWithProviders(<BackupSection />);
    await press(tree, 'Restore from a backup');
    await act(async () => pasteField(tree).props.onChangeText('hello'));
    expect(shownTexts(tree)).toContain('That is not a WeddingGPT backup.');
  });

  it('explains instead of restoring while a synced wedding is open', async () => {
    mockActive = 'ws_1';
    const tree = await renderWithProviders(<BackupSection />);
    await press(tree, 'Restore from a backup');
    expect(pressables(tree, 'Replace my plan with this backup')).toHaveLength(0);
    expect(shownTexts(tree).some((t) => t.includes('sign out first'))).toBe(true);
  });
});
