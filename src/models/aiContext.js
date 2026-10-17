import {
  calculateProgress,
  selectNextBestAction,
  selectUpcomingDeadlines,
  isTaskOverdue,
  isTaskOpen,
} from './planning';
import { summariseBudget } from './budget';
import { summariseRsvps } from './guests';
import { coupleDisplayName, hasExactDate } from './wedding';
import { PLANNING_STAGE_META, CEREMONY_TYPE_META } from './enums';
import { STRESSOR_OPTIONS } from './onboarding';
import { WEDDING_STYLES } from './vision';
import { daysUntil, formatLongDate, formatMonthYear, todayISO } from '../lib/date';
import { formatMoney, formatMoneyCompact, DEFAULT_CURRENCY } from '../lib/currency';

/**
 * The structured wedding context the assistant reasons over (PRD s.14).
 *
 * The PRD is explicit: do not send the whole database with every request. This
 * is the summary instead - a few hundred bytes that answer the questions a
 * couple actually asks ("how much is left?", "who hasn't replied?", "what's
 * next?") without shipping 300 guest records to a model.
 *
 * Money is included pre-formatted. A model handed `4500000` minor units will
 * sooner or later call it 4.5 million dollars; `$45K` it reads correctly.
 * Guest names, contact details and notes are never included.
 */
export function buildWeddingContext({
  wedding,
  tasks = [],
  expenses = [],
  budgetTotal = 0,
  guests = [],
  now = new Date(),
} = {}) {
  if (!wedding) return { hasWedding: false, today: todayISO() };

  const currency = wedding.currency ?? DEFAULT_CURRENCY;
  const money = (minor) => formatMoney(minor, currency);
  const days = wedding.date ? daysUntil(wedding.date, now) : null;
  const exact = hasExactDate(wedding);

  const budget = summariseBudget(budgetTotal, expenses);
  const rsvps = summariseRsvps(guests);
  const open = tasks.filter(isTaskOpen);
  const overdue = open.filter((t) => isTaskOverdue(t, now));
  const next = selectNextBestAction(tasks, now);
  const upcoming = selectUpcomingDeadlines(tasks, 30, now).slice(0, 5);

  return {
    hasWedding: true,
    today: todayISO(),
    couple: {
      displayName: coupleDisplayName(wedding),
      ownerName: wedding.ownerName || null,
      partnerName: wedding.partnerName || null,
    },
    date: {
      iso: wedding.date ?? null,
      exact,
      label: wedding.date ? (exact ? formatLongDate(wedding.date) : formatMonthYear(wedding.date)) : null,
      daysToGo: days,
    },
    location: [wedding.city, wedding.region, wedding.country].filter(Boolean).join(', ') || null,
    ceremony: CEREMONY_TYPE_META[wedding.ceremonyType]?.label ?? null,
    planningStage: PLANNING_STAGE_META[wedding.planningStage]?.label ?? null,
    styles: (wedding.styleTags ?? []).map(
      (key) => WEDDING_STYLES.find((style) => style.key === key)?.name ?? key
    ),
    /** Keys for logic, labels for prose. */
    stressorKeys: (wedding.stressors ?? []).filter((key) => key !== 'nothing'),
    stressors: (wedding.stressors ?? [])
      .filter((key) => key !== 'nothing')
      .map((key) => STRESSOR_OPTIONS.find((o) => o.value === key)?.label ?? key),
    budget: {
      currency,
      isSet: budgetTotal > 0,
      totalMinor: budgetTotal,
      total: money(budgetTotal),
      totalCompact: formatMoneyCompact(budgetTotal, currency),
      spent: money(budget.spent),
      committed: money(budget.committed),
      remaining: money(budget.remaining),
      remainingMinor: budget.remaining,
      isOverBudget: budget.isOverBudget,
      usedPercent: Math.round(budget.usedRatio * 100),
      expenseCount: expenses.length,
    },
    guests: {
      estimate: wedding.guestCountEstimate ?? null,
      onList: rsvps.total,
      attending: rsvps.attending,
      declined: rsvps.declined,
      awaiting: rsvps.awaiting,
      headcount: rsvps.attendingHeadcount,
      responsePercent: Math.round(rsvps.responseRate * 100),
    },
    planning: {
      progressPercent: Math.round(calculateProgress(tasks) * 100),
      openCount: open.length,
      overdueCount: overdue.length,
      overdue: overdue.slice(0, 5).map((t) => ({ title: t.title, dueDate: t.dueDate })),
      nextAction: next ? { title: next.title, dueDate: next.dueDate ?? null } : null,
      upcoming: upcoming.map((t) => ({ title: t.title, dueDate: t.dueDate })),
    },
  };
}

/** Short labels for the "WeddingGPT can see" chips above the chat. */
export function contextChips(context) {
  if (!context?.hasWedding) return [];
  const chips = [];
  if (context.date.daysToGo != null && context.date.daysToGo >= 0) {
    chips.push({ key: 'date', icon: 'calendar', label: `${context.date.daysToGo} days to go` });
  }
  if (context.budget.isSet) {
    chips.push({ key: 'budget', icon: 'budget', label: `${context.budget.totalCompact} budget` });
  }
  if (context.guests.onList > 0) {
    chips.push({ key: 'guests', icon: 'guests', label: `${context.guests.onList} guests` });
  } else if (context.guests.estimate) {
    chips.push({ key: 'guests', icon: 'guests', label: `~${context.guests.estimate} guests` });
  }
  if (context.planning.openCount > 0) {
    chips.push({ key: 'tasks', icon: 'checklist', label: `${context.planning.progressPercent}% planned` });
  }
  return chips;
}
