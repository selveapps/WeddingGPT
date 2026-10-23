import {
  TaskStatus,
  RSVP_STATUS_META,
  INVITATION_STATUS_META,
  MEAL_PREFERENCE_META,
  PAYMENT_STATUS_META,
  PLUS_ONE_STATUS_META,
  calculateProgress,
  coupleDisplayName,
  summariseBudget,
  summariseRsvps,
} from '@/models';
import { formatMoney, toMajor } from '@/lib/currency';
import { daysUntil, formatLongDate, formatMediumDate } from '@/lib/date';

import { toCsv } from '@/lib/csv';
import { SYNC_COLLECTIONS, decodeSnapshot } from '../sync/model';

/**
 * Export and backup (Labs).
 *
 * Everything the couple has lives on one phone, so losing the phone loses the
 * wedding. This gives them their data back in forms they can use elsewhere -
 * spreadsheets for guests and budget, text for the checklist and a summary -
 * plus a full backup. The backup is the partner-sync snapshot with a checksum,
 * so restoring is the same previewed merge as partner sync.
 */

// --- Spreadsheets -----------------------------------------------------------

export function guestsCsv(guests = [], households = []) {
  const householdName = new Map(households.map((h) => [h.id, h.name]));
  const rows = [
    ['First name', 'Last name', 'Household', 'Email', 'Phone', 'RSVP', 'Invitation', 'Meal', 'Dietary notes', 'Plus one', 'Plus one name', 'Child', 'Tags', 'Notes'],
  ];
  for (const guest of guests) {
    rows.push([
      guest.firstName,
      guest.lastName,
      householdName.get(guest.householdId) ?? '',
      guest.email ?? '',
      guest.phone ?? '',
      RSVP_STATUS_META[guest.rsvpStatus]?.label ?? '',
      INVITATION_STATUS_META[guest.invitationStatus]?.label ?? '',
      MEAL_PREFERENCE_META[guest.mealPreference]?.label ?? '',
      guest.dietaryNotes ?? '',
      PLUS_ONE_STATUS_META[guest.plusOneStatus]?.label ?? '',
      guest.plusOneName ?? '',
      guest.isChild ? 'Yes' : 'No',
      (guest.tags ?? []).join('; '),
      guest.notes ?? '',
    ]);
  }
  return toCsv(rows);
}

/** Amounts as plain numbers (dollars), so spreadsheet sums just work. */
export function budgetCsv(expenses = [], categories = []) {
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const rows = [['Item', 'Category', 'Vendor', 'Amount', 'Paid', 'Owed', 'Status', 'Due date']];
  for (const expense of expenses) {
    const amount = expense.amount ?? 0;
    const paid = Math.min(expense.paidAmount ?? 0, amount);
    rows.push([
      expense.title,
      categoryName.get(expense.budgetCategoryId) ?? 'Uncategorised',
      expense.vendorName ?? '',
      toMajor(amount),
      toMajor(paid),
      toMajor(amount - paid),
      PAYMENT_STATUS_META[expense.paymentStatus]?.label ?? '',
      expense.dueDate ?? '',
    ]);
  }
  return toCsv(rows);
}

// --- Text -------------------------------------------------------------------

export function checklistText(tasks = [], categories = []) {
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const open = tasks
    .filter((t) => t.status !== TaskStatus.DONE && t.status !== TaskStatus.SKIPPED)
    .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));
  const done = tasks.filter((t) => t.status === TaskStatus.DONE);

  const line = (task, mark) => {
    const extra = [task.dueDate ? formatMediumDate(task.dueDate) : null, categoryName.get(task.categoryId)]
      .filter(Boolean)
      .join(', ');
    return `${mark} ${task.title}${extra ? ` (${extra})` : ''}`;
  };

  const lines = [`Wedding checklist - ${done.length} of ${open.length + done.length} done`, ''];
  if (open.length) lines.push('To do:', ...open.map((t) => line(t, '[ ]')), '');
  if (done.length) lines.push('Done:', ...done.map((t) => line(t, '[x]')));
  return lines.join('\n').trim();
}

export function planSummary({ wedding = null, tasks = [], budget = null, expenses = [], guests = [], from = new Date() } = {}) {
  const lines = [wedding ? `${coupleDisplayName(wedding)} - plan summary` : 'Wedding plan summary', ''];

  if (wedding?.date) {
    const days = daysUntil(wedding.date, from);
    lines.push(`Date: ${formatLongDate(wedding.date)}${days > 0 ? ` (${days} days to go)` : ''}`);
  }
  if (wedding?.city) lines.push(`Where: ${wedding.city}`);

  lines.push(`Checklist: ${Math.round(calculateProgress(tasks) * 100)}% done (${tasks.length} tasks)`);

  if (budget) {
    const money = summariseBudget(budget.total ?? 0, expenses);
    lines.push(
      `Budget: ${formatMoney(money.total)} - ${formatMoney(money.spent)} spent, ${formatMoney(money.committed)} committed, ${formatMoney(money.remaining)} left`
    );
  }

  if (guests.length) {
    const rsvp = summariseRsvps(guests);
    lines.push(`Guests: ${rsvp.total} invited, ${rsvp.attendingHeadcount} coming, ${rsvp.declined} declined, ${rsvp.awaiting} awaiting`);
  }

  return lines.join('\n');
}

// --- Backup -----------------------------------------------------------------

/** FNV-1a over the JSON, as 8 hex characters. Detects damage, not tampering. */
export function checksum(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** The snapshot's content without the checksum field, in a stable form. */
const contentOf = (snapshot) => JSON.stringify({ collections: snapshot.collections, singletons: snapshot.singletons });

export function wrapBackup(snapshot) {
  return JSON.stringify({ ...snapshot, checksum: checksum(contentOf(snapshot)) });
}

export function backupCounts(snapshot) {
  return SYNC_COLLECTIONS.map(({ key, label }) => ({
    key,
    label,
    count: snapshot.collections?.[key]?.allIds?.length ?? 0,
  }));
}

/**
 * Check pasted backup text before anyone restores it. A missing checksum is
 * allowed (a partner-sync snapshot is a valid backup); a wrong one is not.
 */
export function verifyBackup(text) {
  const decoded = decodeSnapshot(text);
  if (!decoded.ok) return decoded;

  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That backup could not be read.' };
  }

  if (raw.checksum && raw.checksum !== checksum(contentOf(decoded.snapshot))) {
    return { ok: false, error: 'This backup has been changed or cut off since it was made.' };
  }

  return {
    ok: true,
    snapshot: decoded.snapshot,
    verified: Boolean(raw.checksum),
    counts: backupCounts(decoded.snapshot),
    weddingName: decoded.snapshot.singletons?.wedding ? coupleDisplayName(decoded.snapshot.singletons.wedding) : null,
  };
}

