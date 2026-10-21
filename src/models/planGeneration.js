import { createTask } from './planning';
import { TaskPriority, DateType, PlanningStage } from './enums';
import { addDays, addMonths, daysUntil, toISODate } from '../lib/date';

/**
 * Personalised plan generation (PRD s.4.4).
 *
 * Onboarding ends with a plan, not a confirmation screen. This module turns the
 * couple's answers into a real checklist with real dates, which is the first
 * moment the product proves it understood them.
 *
 * The template below is the domain knowledge of the product. Each entry says
 * how many months before the wedding the task is normally done; the generator
 * converts that into an actual due date from the couple's own date.
 */

/**
 * The master checklist.
 *
 * `essential` tasks are generated no matter how close the wedding is - a couple
 * eight weeks out still needs a licence and a guest list, even though those
 * belong to a twelve-month window they no longer have.
 */
export const CHECKLIST_TEMPLATE = [
  // --- Foundations ---------------------------------------------------------
  {
    categoryKey: 'foundations',
    monthsBefore: 12,
    title: 'Agree the feeling you want',
    description:
      'Before venues or numbers: how should the day actually feel? Everything else gets easier once you both answer this.',
    essential: true,
  },
  {
    categoryKey: 'foundations',
    monthsBefore: 12,
    title: 'Set a realistic total budget',
    description: 'Including who is contributing, and what that money is expected to cover.',
    priority: TaskPriority.HIGH,
    essential: true,
  },
  {
    categoryKey: 'foundations',
    monthsBefore: 12,
    title: 'Draft a rough guest count',
    description:
      'An approximate number is enough. Almost every other decision scales off it.',
    priority: TaskPriority.HIGH,
    essential: true,
  },
  {
    categoryKey: 'foundations',
    monthsBefore: 11,
    title: 'Choose your date or window',
    description: 'An exact date if you have one, a month if you do not.',
    essential: true,
  },
  {
    categoryKey: 'foundations',
    monthsBefore: 10,
    title: 'Decide who is in the wedding party',
    description: 'Ask them properly, and early enough that they can plan around it.',
  },
  {
    categoryKey: 'foundations',
    monthsBefore: 6,
    title: 'Agree the day-of running order',
    description: 'Roughly what happens when, from getting ready to the last song.',
  },

  // --- Venue ---------------------------------------------------------------
  {
    categoryKey: 'venue',
    monthsBefore: 11,
    title: 'Shortlist venues',
    description:
      'Three or four that fit your number and your budget. Resist falling for one before you have seen the others.',
    priority: TaskPriority.HIGH,
    essential: true,
  },
  {
    categoryKey: 'venue',
    monthsBefore: 10,
    title: 'Visit your shortlist',
    description: 'At the same time of day as your wedding, if you can. Light changes everything.',
  },
  {
    categoryKey: 'venue',
    monthsBefore: 9,
    title: 'Book the ceremony venue',
    description: 'Read the cancellation terms before you sign, not after.',
    priority: TaskPriority.HIGH,
    essential: true,
  },
  {
    categoryKey: 'venue',
    monthsBefore: 9,
    title: 'Book the reception venue',
    description: 'Confirm what is included: tables, linen, staff, corkage, end time.',
    priority: TaskPriority.HIGH,
    essential: true,
  },
  {
    categoryKey: 'venue',
    monthsBefore: 3,
    title: 'Confirm the venue timeline',
    description: 'Access time, supplier arrival, noise curfew, clear-down.',
  },
  {
    categoryKey: 'venue',
    monthsBefore: 1,
    title: 'Send the venue your final numbers',
    description: 'Most venues need a confirmed headcount two to four weeks out.',
    priority: TaskPriority.HIGH,
  },

  // --- Vendors -------------------------------------------------------------
  {
    categoryKey: 'vendors',
    monthsBefore: 10,
    title: 'Book your photographer',
    description:
      'Good photographers go first. Look at one full wedding, not just a highlight reel.',
    priority: TaskPriority.HIGH,
    essential: true,
  },
  {
    categoryKey: 'vendors',
    monthsBefore: 9,
    title: 'Book catering',
    description: 'Confirm dietary handling, and whether staffing and hire are included.',
    priority: TaskPriority.HIGH,
    essential: true,
  },
  {
    categoryKey: 'vendors',
    monthsBefore: 8,
    title: 'Book music for the ceremony and the party',
    description: 'Band or DJ, plus whatever plays while people arrive.',
  },
  {
    categoryKey: 'vendors',
    monthsBefore: 7,
    title: 'Book flowers and styling',
    description: 'Bring photographs of your venue, not just of flowers you like.',
  },
  {
    categoryKey: 'vendors',
    monthsBefore: 6,
    title: 'Book hair and makeup',
    description: 'Ask how many people they can do, and how long each one takes.',
  },
  {
    categoryKey: 'vendors',
    monthsBefore: 5,
    title: 'Book transport',
    description: 'For you, and for anyone who will struggle to get there.',
  },
  {
    categoryKey: 'vendors',
    monthsBefore: 2,
    title: 'Confirm every vendor in writing',
    description: 'Arrival time, contact number, and what they need from you on the day.',
    priority: TaskPriority.HIGH,
    essential: true,
  },
  {
    categoryKey: 'vendors',
    monthsBefore: 1,
    title: 'Share the running order with all vendors',
    description: 'One document, sent to everyone, so nobody is guessing.',
  },

  // --- Guests --------------------------------------------------------------
  {
    categoryKey: 'guests',
    monthsBefore: 10,
    title: 'Build the full guest list',
    description:
      'Draft it separately, then merge. It avoids one person quietly making all the cuts.',
    priority: TaskPriority.HIGH,
    essential: true,
  },
  {
    categoryKey: 'guests',
    monthsBefore: 9,
    title: 'Collect addresses and contact details',
    description: 'Far more tedious later. Ask once, and keep it here.',
  },
  {
    categoryKey: 'guests',
    monthsBefore: 8,
    title: 'Send save the dates',
    description: 'Especially important if people need to travel or book time off.',
  },
  {
    categoryKey: 'guests',
    monthsBefore: 4,
    title: 'Send the invitations',
    description: 'With a clear RSVP deadline about four weeks before you need numbers.',
    priority: TaskPriority.HIGH,
    essential: true,
  },
  {
    categoryKey: 'guests',
    monthsBefore: 2,
    title: 'Chase outstanding RSVPs',
    description: 'Some people simply need asking twice. It is not rude.',
    essential: true,
  },
  {
    categoryKey: 'guests',
    monthsBefore: 1,
    title: 'Finalise the seating plan',
    description: 'Do it once RSVPs are genuinely closed, or you will do it three times.',
    priority: TaskPriority.HIGH,
  },
  {
    categoryKey: 'guests',
    monthsBefore: 1,
    title: 'Collect dietary requirements',
    description: 'Pass the final tally to your caterer along with the headcount.',
  },

  // --- Attire --------------------------------------------------------------
  {
    categoryKey: 'attire',
    monthsBefore: 9,
    title: 'Start looking at outfits',
    description:
      'Made to order can take six months, plus fittings. Start earlier than feels necessary.',
    essential: true,
  },
  {
    categoryKey: 'attire',
    monthsBefore: 6,
    title: 'Order your outfits',
    description: 'Confirm the delivery date in writing, and leave room for alterations.',
    priority: TaskPriority.HIGH,
  },
  {
    categoryKey: 'attire',
    monthsBefore: 3,
    title: 'Book your fittings',
    description: 'Usually two or three, with the last one close to the day.',
  },
  {
    categoryKey: 'attire',
    monthsBefore: 2,
    title: 'Sort accessories and shoes',
    description: 'Bring the actual shoes to your final fitting.',
  },
  {
    categoryKey: 'attire',
    monthsBefore: 1,
    title: 'Final fitting',
    description: 'Take whoever is helping you dress on the day.',
  },

  // --- Budget --------------------------------------------------------------
  {
    categoryKey: 'budget',
    monthsBefore: 11,
    title: 'Split the budget across categories',
    description: 'A starting split is already waiting for you in the Budget tab.',
    essential: true,
  },
  {
    categoryKey: 'budget',
    monthsBefore: 8,
    title: 'Set up a payment schedule',
    description:
      'List every deposit and balance with its due date, so nothing lands as a surprise.',
    essential: true,
  },
  {
    categoryKey: 'budget',
    monthsBefore: 4,
    title: 'Review the budget against reality',
    description: 'Halfway is the right time to correct course, while correcting is still cheap.',
    priority: TaskPriority.HIGH,
  },
  {
    categoryKey: 'budget',
    monthsBefore: 1,
    title: 'Settle the final balances',
    description: 'Most vendors want the balance one to four weeks before.',
    priority: TaskPriority.HIGH,
    essential: true,
  },

  // --- Paperwork -----------------------------------------------------------
  {
    categoryKey: 'paperwork',
    monthsBefore: 6,
    title: 'Check the legal requirements',
    description: 'Notice periods and documents differ by place. Confirm yours early.',
    priority: TaskPriority.HIGH,
    essential: true,
  },
  {
    categoryKey: 'paperwork',
    monthsBefore: 3,
    title: 'Give notice or file the paperwork',
    description: 'Miss the notice window and the date itself is at risk.',
    priority: TaskPriority.HIGH,
    essential: true,
  },
  {
    categoryKey: 'paperwork',
    monthsBefore: 2,
    title: 'Confirm your officiant',
    description: 'Including what they need from you, and any rehearsal.',
  },
  {
    categoryKey: 'paperwork',
    monthsBefore: 1,
    title: 'Gather the documents for the day',
    description: 'Keep them with someone reliable who is not you.',
    essential: true,
  },

  // --- Details -------------------------------------------------------------
  {
    categoryKey: 'details',
    monthsBefore: 5,
    title: 'Decide on your decor',
    description: 'Photograph what you already own before buying anything.',
  },
  {
    categoryKey: 'details',
    monthsBefore: 3,
    title: 'Order stationery for the day',
    description: 'Menus, place cards, signage, order of service.',
  },
  {
    categoryKey: 'details',
    monthsBefore: 2,
    title: 'Plan the small touches',
    description: 'Favours, the guest book, anything you want people to take away.',
  },
  {
    categoryKey: 'details',
    monthsBefore: 1,
    title: 'Pack everything into labelled boxes',
    description:
      'Label by where it goes, not by what it is. Whoever sets up will thank you.',
  },

  // --- The week of ---------------------------------------------------------
  {
    categoryKey: 'week_of',
    monthsBefore: 0,
    title: 'Write the day-of contact sheet',
    description: 'Every vendor, every key person. One page, shared with two people.',
    priority: TaskPriority.HIGH,
    essential: true,
  },
  {
    categoryKey: 'week_of',
    monthsBefore: 0,
    title: 'Hold the rehearsal',
    description: 'Walk it through with anyone who has a job on the day.',
    essential: true,
  },
  {
    categoryKey: 'week_of',
    monthsBefore: 0,
    title: 'Delegate the day-of jobs',
    description: 'Who holds the rings, who pays the balance, who takes the gifts home.',
    priority: TaskPriority.HIGH,
    essential: true,
  },
  {
    categoryKey: 'week_of',
    monthsBefore: 0,
    title: 'Pack an emergency kit',
    description: 'Plasters, safety pins, a phone charger, something to eat.',
  },
  {
    categoryKey: 'week_of',
    monthsBefore: 0,
    title: 'Stop planning',
    description:
      'Genuinely. Whatever is not done by now will not be noticed by anyone but you.',
    essential: true,
  },
];

/** How many months of runway a planning stage implies when we have no date. */
const STAGE_HORIZON_MONTHS = {
  [PlanningStage.JUST_ENGAGED]: 14,
  [PlanningStage.EARLY_PLANNING]: 12,
  [PlanningStage.DEEP_IN_IT]: 8,
  [PlanningStage.FINAL_STRETCH]: 4,
  [PlanningStage.ALMOST_THERE]: 1,
};

/**
 * How far out the wedding is, in months.
 *
 * Falls back to the planning stage when the date is approximate or absent - a
 * couple who said "almost there" gets a short, urgent plan even if they have
 * not pinned a date yet.
 */
export function planningHorizonMonths(wedding, from = new Date()) {
  const usable =
    wedding?.date &&
    (wedding.dateType === DateType.EXACT ||
      wedding.dateType === DateType.MONTH ||
      wedding.dateType === DateType.SEASON);

  if (usable) {
    const days = daysUntil(wedding.date, from);
    if (days !== null) return Math.max(0, Math.round(days / 30.44));
  }

  return STAGE_HORIZON_MONTHS[wedding?.planningStage] ?? 12;
}

/**
 * Turn the template into real tasks for this wedding.
 *
 * Two judgement calls worth knowing about:
 *
 * 1. Tasks whose natural window has already passed are pulled forward into the
 *    next few weeks rather than generated overdue. A couple three months out
 *    should not open the app to thirty red rows - PRD s.27 asks for calm, and
 *    an overdue list you were handed rather than earned is not information.
 *
 * 2. Templates belonging to a longer window than the couple has are dropped,
 *    unless marked `essential`. Telling someone eight weeks out to shortlist
 *    venues over twelve months is noise; telling them to file paperwork is not.
 */
export function generatePersonalisedPlan({ wedding, categories = [], from = new Date() } = {}) {
  if (!wedding) return { tasks: [], horizonMonths: 0 };

  const horizonMonths = planningHorizonMonths(wedding, from);
  const categoryIdByKey = new Map(categories.map((category) => [category.key, category.id]));

  const applicable = CHECKLIST_TEMPLATE.filter(
    (entry) => entry.essential || entry.monthsBefore <= horizonMonths
  );

  // Furthest-out window first, so the pull-forward below preserves real urgency:
  // the task that was most overdue in template terms gets the earliest slot.
  const ordered = [...applicable].sort((a, b) => b.monthsBefore - a.monthsBefore);

  const today = toISODate(from);
  // The earliest a pulled-forward task may land. Never today - a checklist due
  // the moment it is created reads as a failure you have already made.
  const floorDate = addDays(today, 3);
  const floorOffset = daysUntil(floorDate, from);
  let pulledForward = 0;

  const tasks = ordered.map((entry) => {
    const natural =
      wedding.date && wedding.dateType !== DateType.UNDECIDED
        ? addMonths(wedding.date, -entry.monthsBefore)
        : addMonths(today, Math.max(0, horizonMonths - entry.monthsBefore));

    let dueDate = natural;

    if (!dueDate || daysUntil(dueDate, from) < floorOffset) {
      // Stagger the backlog a few days apart rather than stacking it on one date.
      dueDate = addDays(floorDate, pulledForward * 3);
      pulledForward += 1;
    }

    return createTask({
      weddingId: wedding.id,
      categoryId: categoryIdByKey.get(entry.categoryKey) ?? null,
      title: entry.title,
      description: entry.description ?? '',
      dueDate,
      priority: entry.priority ?? TaskPriority.NORMAL,
      isSystemGenerated: true,
      monthsBefore: entry.monthsBefore,
    });
  });

  return { tasks, horizonMonths };
}

/**
 * The first three things to do, for the plan reveal screen (PRD s.4.4).
 * Deliberately three: enough to feel like a plan, few enough to feel possible.
 */
export function firstRecommendedActions(tasks = [], count = 3) {
  return [...tasks]
    .filter((task) => task.dueDate)
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0))
    .slice(0, count);
}
