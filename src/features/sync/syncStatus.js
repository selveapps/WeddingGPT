import { SyncErrorCode } from '@/services/sync/syncClient';

/**
 * Copy for the sync section of the Account screen, as pure functions so the
 * wording is tested rather than eyeballed.
 */

const ERROR_COPY = {
  [SyncErrorCode.OFFLINE]: "You're offline. Changes are saved here and will sync when you're back.",
  [SyncErrorCode.TIMEOUT]: 'Syncing took too long. It will try again shortly.',
  [SyncErrorCode.UNAVAILABLE]: 'Sync is unavailable right now. It will try again shortly.',
  [SyncErrorCode.UNAUTHORISED]: 'You were signed out. Sign in again to keep syncing.',
  [SyncErrorCode.GONE]:
    'This phone was disconnected from the shared wedding - it was deleted, or you were removed from it. Your own wedding is back.',
  [SyncErrorCode.INVALID]: 'Some changes could not be synced.',
  [SyncErrorCode.LIMIT_REACHED]: 'Your account has reached the limit of weddings.',
};

export function syncErrorMessage(code) {
  return code ? (ERROR_COPY[code] ?? ERROR_COPY[SyncErrorCode.UNAVAILABLE]) : null;
}

/** "Just now", "5 minutes ago", "3 hours ago", "2 days ago". */
export function timeAgo(iso, now = new Date()) {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;
  const minutes = Math.max(0, Math.round((now.getTime() - then) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

/** One line: what the person needs to know about sync right now. */
export function describeSyncStatus({
  pending = 0,
  lastSyncedAt = null,
  lastError = null,
  now = new Date(),
} = {}) {
  if (lastError) return { tone: 'warning', text: syncErrorMessage(lastError) };
  if (pending > 0) {
    return { tone: 'info', text: `${pending} ${pending === 1 ? 'change' : 'changes'} waiting to sync` };
  }
  if (lastSyncedAt) return { tone: 'success', text: `Synced ${timeAgo(lastSyncedAt, now)}` };
  return { tone: 'neutral', text: 'Not synced yet' };
}

const COLLECTION_LABELS = {
  wedding: 'Wedding details',
  budget: 'Budget total',
  tasks: 'A task',
  taskCategories: 'A task category',
  expenses: 'An expense',
  budgetCategories: 'A budget category',
  guests: 'A guest',
  households: 'A household',
  vendors: 'A vendor',
};

/** "A guest (Meera Shah) was also changed on another phone." */
export function describeConflict(conflict) {
  const label = COLLECTION_LABELS[conflict.collection] ?? 'Something';
  const data = conflict.overwritten?.data;
  const name =
    data?.title || data?.name || [data?.firstName, data?.lastName].filter(Boolean).join(' ') || null;
  if (conflict.overwritten?.deletedAt) {
    return `${label}${name ? ` (${name})` : ''} had been deleted on another phone; your edit brought it back.`;
  }
  return `${label}${name ? ` (${name})` : ''} was also changed on another phone. Yours was kept.`;
}

/** The warning before signing out with changes that have not synced. */
export function signOutWarning(pending) {
  if (!pending) return null;
  return `${pending} ${pending === 1 ? 'change has' : 'changes have'} not synced yet and will be lost from this phone if you sign out now.`;
}
