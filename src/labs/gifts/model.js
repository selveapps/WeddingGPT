import { guestFullName } from '@/models';
import { addDays, daysUntil, formatMediumDate } from '@/lib/date';

/**
 * Gifts and thank-you notes (Labs).
 *
 * The rule of thumb most etiquette guides give: thank a gift that arrives
 * before the wedding within two weeks, and anything from the day itself within
 * three months. That is what `thankYouDue` encodes.
 */

export const ThankYouStatus = {
  TODO: 'todo',
  DRAFTED: 'drafted',
  SENT: 'sent',
};

export const THANK_YOU_META = {
  [ThankYouStatus.TODO]: { label: 'Thank-you to write', tone: 'warning' },
  [ThankYouStatus.DRAFTED]: { label: 'Drafted', tone: 'info' },
  [ThankYouStatus.SENT]: { label: 'Thanked', tone: 'success' },
};

const CYCLE = [ThankYouStatus.TODO, ThankYouStatus.DRAFTED, ThankYouStatus.SENT];

export function nextThankYouStatus(status) {
  return CYCLE[(CYCLE.indexOf(status) + 1) % CYCLE.length];
}

export const GiftKind = {
  ITEM: 'item',
  MONEY: 'money',
  EXPERIENCE: 'experience',
};

export const GIFT_KIND_OPTIONS = [
  { value: GiftKind.ITEM, label: 'Gift' },
  { value: GiftKind.MONEY, label: 'Money' },
  { value: GiftKind.EXPERIENCE, label: 'Experience' },
];

export const BEFORE_WEDDING_DAYS = 14;
export const AFTER_WEDDING_DAYS = 90;

export function thankYouDue(gift, { weddingDate = null, from = new Date() } = {}) {
  if (!gift?.receivedOn) return { dueDate: null, daysLeft: null, overdue: false };

  let dueDate;
  if (!weddingDate) {
    dueDate = addDays(gift.receivedOn, AFTER_WEDDING_DAYS);
  } else if (gift.receivedOn < weddingDate) {
    dueDate = addDays(gift.receivedOn, BEFORE_WEDDING_DAYS);
  } else {
    // Three months from the day - but never less than two weeks for a late gift.
    const fromWedding = addDays(weddingDate, AFTER_WEDDING_DAYS);
    const fromReceipt = addDays(gift.receivedOn, BEFORE_WEDDING_DAYS);
    dueDate = fromWedding > fromReceipt ? fromWedding : fromReceipt;
  }

  const daysLeft = daysUntil(dueDate, from);
  return {
    dueDate,
    daysLeft,
    overdue: gift.thankYouStatus !== ThankYouStatus.SENT && daysLeft !== null && daysLeft < 0,
  };
}

export function summariseGifts(gifts = []) {
  const counts = { [ThankYouStatus.TODO]: 0, [ThankYouStatus.DRAFTED]: 0, [ThankYouStatus.SENT]: 0 };
  let money = 0;
  for (const gift of gifts) {
    counts[gift.thankYouStatus ?? ThankYouStatus.TODO]++;
    if (gift.kind === GiftKind.MONEY) money += gift.value ?? 0;
  }
  return {
    total: gifts.length,
    money,
    toWrite: counts[ThankYouStatus.TODO] + counts[ThankYouStatus.DRAFTED],
    sent: counts[ThankYouStatus.SENT],
    progress: gifts.length ? counts[ThankYouStatus.SENT] / gifts.length : 0,
  };
}

/** Unsent first, most urgent first, thanked at the bottom. */
export function sortGifts(gifts = [], context = {}) {
  const rank = (gift) => (gift.thankYouStatus === ThankYouStatus.SENT ? 1 : 0);
  return [...gifts].sort((a, b) => {
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    const da = thankYouDue(a, context).dueDate ?? '9999';
    const db = thankYouDue(b, context).dueDate ?? '9999';
    return da.localeCompare(db);
  });
}

/** Find the guest a gift came from by name, so notes can use their first name. */
export function matchGuest(name, guests = []) {
  const wanted = (name ?? '').trim().toLowerCase();
  if (!wanted) return null;
  return (
    guests.find((guest) => guestFullName(guest).toLowerCase() === wanted) ??
    guests.find((guest) => (guest.firstName ?? '').toLowerCase() === wanted) ??
    null
  );
}

/**
 * A warm first draft that names the gift. The couple edits it - a thank-you
 * note that reads like a template is worse than a late one.
 */
export function draftThankYou({ gift, coupleName = 'Us' }) {
  const to = gift.fromName?.trim() || 'friend';
  const what = gift.description?.trim();
  let body;
  if (gift.kind === GiftKind.MONEY) {
    body = `Thank you so much for your generous gift${what ? ` towards ${what}` : ''}. We are putting it towards something we will remember - and we will think of you when we do.`;
  } else if (gift.kind === GiftKind.EXPERIENCE) {
    body = `Thank you for ${what || 'such a thoughtful experience'}. We cannot wait to do it together, and we will tell you all about it.`;
  } else {
    body = `Thank you so much for the ${what || 'lovely gift'}. It is already part of our home, and it means a lot that you chose it for us.`;
  }
  return [`Dear ${to},`, '', body, '', 'Having you in our lives made the day what it was.', '', 'With love,', coupleName].join('\n');
}

export function dueLabel(due) {
  if (!due.dueDate) return '';
  if (due.overdue) return `Overdue since ${formatMediumDate(due.dueDate)}`;
  return `Thank by ${formatMediumDate(due.dueDate)}`;
}
