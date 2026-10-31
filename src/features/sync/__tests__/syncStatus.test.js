import {
  describeConflict,
  describeSyncStatus,
  signOutWarning,
  syncErrorMessage,
  timeAgo,
} from '../syncStatus';

const NOW = new Date('2027-01-04T12:00:00.000Z');
const ago = (ms) => new Date(NOW.getTime() - ms).toISOString();

describe('timeAgo', () => {
  it('reads naturally at each scale', () => {
    expect(timeAgo(ago(10 * 1000), NOW)).toBe('just now');
    expect(timeAgo(ago(60 * 1000), NOW)).toBe('1 minute ago');
    expect(timeAgo(ago(5 * 60 * 1000), NOW)).toBe('5 minutes ago');
    expect(timeAgo(ago(60 * 60 * 1000), NOW)).toBe('1 hour ago');
    expect(timeAgo(ago(26 * 60 * 60 * 1000), NOW)).toBe('1 day ago');
    expect(timeAgo(ago(3 * 24 * 60 * 60 * 1000), NOW)).toBe('3 days ago');
    expect(timeAgo('not a date', NOW)).toBeNull();
  });
});

describe('describeSyncStatus', () => {
  it('puts errors first, then waiting changes, then the last sync', () => {
    expect(describeSyncStatus({ lastError: 'offline', pending: 3, now: NOW }).tone).toBe('warning');
    expect(describeSyncStatus({ pending: 1, lastSyncedAt: ago(0), now: NOW })).toEqual({
      tone: 'info',
      text: '1 change waiting to sync',
    });
    expect(describeSyncStatus({ pending: 0, lastSyncedAt: ago(5 * 60 * 1000), now: NOW })).toEqual({
      tone: 'success',
      text: 'Synced 5 minutes ago',
    });
    expect(describeSyncStatus({ now: NOW })).toEqual({ tone: 'neutral', text: 'Not synced yet' });
  });
});

describe('syncErrorMessage', () => {
  it('explains known errors and falls back for unknown ones', () => {
    expect(syncErrorMessage('offline')).toMatch(/offline/);
    expect(syncErrorMessage('gone')).toMatch(/disconnected/);
    expect(syncErrorMessage('something_new')).toBe(syncErrorMessage('unavailable'));
    expect(syncErrorMessage(null)).toBeNull();
  });
});

describe('describeConflict', () => {
  it('names the record when it can', () => {
    expect(
      describeConflict({
        collection: 'guests',
        overwritten: { data: { firstName: 'Meera', lastName: 'Shah' } },
      })
    ).toBe('A guest (Meera Shah) was also changed on another phone. Yours was kept.');
    expect(describeConflict({ collection: 'tasks', overwritten: { data: { title: 'Book venue' } } })).toBe(
      'A task (Book venue) was also changed on another phone. Yours was kept.'
    );
    expect(describeConflict({ collection: 'wedding', overwritten: { data: {} } })).toBe(
      'Wedding details was also changed on another phone. Yours was kept.'
    );
  });

  it('explains when an edit brought back something deleted elsewhere', () => {
    expect(describeConflict({ collection: 'vendors', overwritten: { deletedAt: 'x', data: null } })).toBe(
      'A vendor had been deleted on another phone; your edit brought it back.'
    );
  });
});

describe('signOutWarning', () => {
  it('warns only when changes would be lost', () => {
    expect(signOutWarning(0)).toBeNull();
    expect(signOutWarning(1)).toBe(
      '1 change has not synced yet and will be lost from this phone if you sign out now.'
    );
    expect(signOutWarning(4)).toMatch(/^4 changes have/);
  });
});
