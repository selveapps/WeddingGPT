import { LOCAL_WORKSPACE, workspaceStorage } from '@/services/storage';
import { SYNCED_SLICES } from '@/services/sync/collections';
import { buildBackup, readBackup } from '@/models';

/**
 * What a backup holds, and how it is put back: every slice that syncs, except
 * guests' RSVP replies, which only the server writes.
 */
const LABELS = {
  wedding: 'Wedding',
  budget: 'Budget',
  tasks: 'Tasks',
  taskCategories: 'Task categories',
  expenses: 'Expenses',
  budgetCategories: 'Budget categories',
  guests: 'Guests',
  households: 'Households',
  vendors: 'Vendors',
  website: 'Wedding website',
  seatingTables: 'Seating tables',
  seatingRules: 'Seating rules',
  events: 'Events',
  gifts: 'Gifts',
  partyMembers: 'Wedding party',
  runOfShow: 'Run of show',
  packingItems: 'Packing items',
};

export const BACKUP_SLICES = SYNCED_SLICES.filter((slice) => !slice.readOnly).map((slice) => ({
  ...slice,
  label: LABELS[slice.collection] ?? slice.collection,
}));

/** The backup file's text for what is on this phone now. */
export function createBackupText({ slices = BACKUP_SLICES, createdAt } = {}) {
  return buildBackup(
    slices.map((slice) => ({
      collection: slice.collection,
      kind: slice.kind,
      value: slice.store.getState()[slice.key],
    })),
    { createdAt }
  );
}

export function checkBackup(text, { slices = BACKUP_SLICES } = {}) {
  return readBackup(text, slices);
}

/**
 * Restoring replaces the phone's own plan. A synced wedding is restored by
 * the server, not from a file: writing a file into it would push every record
 * to the partner's phone as a fresh edit.
 */
export const canRestoreHere = (storage = workspaceStorage) => storage.getActive() === LOCAL_WORKSPACE;

/** Put a checked backup (`checkBackup(...)` result) back. Returns how many records came back. */
export function restoreBackup(checked, { slices = BACKUP_SLICES, storage = workspaceStorage } = {}) {
  if (!checked?.ok) throw new Error('not a checked backup');
  if (!canRestoreHere(storage)) throw new Error('restore only into the phone’s own plan');
  let records = 0;
  for (const slice of slices) {
    const value =
      checked.collections[slice.collection] ?? (slice.kind === 'one' ? null : { byId: {}, allIds: [] });
    slice.store.setState({ [slice.key]: value });
    records += slice.kind === 'one' ? (value ? 1 : 0) : value.allIds.length;
  }
  return records;
}
