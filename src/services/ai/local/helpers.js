import { addDays, addMonths, daysUntil, formatMediumDate, formatRelativeDay, todayISO } from '../../../lib/date';

/**
 * Small writing helpers shared by the intent answers, so every reply formats
 * dates, lists and names the same way.
 */

export const bullets = (items) => items.filter(Boolean).map((item) => `- ${item}`).join('\n');

export const firstName = (ctx) => ctx?.couple?.ownerName || null;

/** "Priya, " or "" - for a warm opener that never reads as "undefined, ". */
export const namePrefix = (ctx) => (firstName(ctx) ? `${firstName(ctx)}, ` : '');

export function dueLabel(iso) {
  if (!iso) return 'no date yet';
  return `${formatRelativeDay(iso).toLowerCase()} (${formatMediumDate(iso)})`;
}

export function weddingDateLine(ctx) {
  if (!ctx?.date?.iso) return null;
  const days = ctx.date.daysToGo;
  if (days == null) return null;
  if (days < 0) return `Your wedding date (${ctx.date.label}) has passed.`;
  if (days === 0) return 'Your wedding is **today**.';
  return `**${days} days** to go until ${ctx.date.label}.`;
}

/**
 * A due date for a task that is normally done `monthsBefore` the wedding.
 * If that moment has already passed, pull it forward to the coming weeks and
 * stagger it - the same rule plan generation uses, so AI-proposed tasks never
 * arrive already overdue.
 */
export function dueDateFor(ctx, monthsBefore, index = 0) {
  const today = todayISO();
  const wedding = ctx?.date?.iso;
  if (!wedding) return addDays(today, 7 * (index + 1));
  const ideal = addMonths(wedding, -monthsBefore);
  if (ideal && daysUntil(ideal) > 0) return ideal;
  const staggered = addDays(today, 5 * (index + 1));
  return daysUntil(staggered, new Date()) < (ctx.date.daysToGo ?? Infinity) ? staggered : wedding;
}

/** Months left, rounded down, for "you have about N months" phrasing. */
export function monthsLeft(ctx) {
  const days = ctx?.date?.daysToGo;
  return days == null ? null : Math.max(0, Math.floor(days / 30));
}

export const has = (text, ...words) => words.some((word) => text.includes(word));

/**
 * Pick the topic entry whose `match` fits. The latest message wins over the
 * combined follow-up text, so "questions for the venue" then "and the
 * caterer?" answers about the caterer, not the venue again.
 */
export function pickTopic(entries, text, current) {
  return (
    (current && entries.find((entry) => entry.match.test(current))) ||
    entries.find((entry) => entry.match.test(text)) ||
    null
  );
}
