import { DEFAULT_BUDGET_ALLOCATION } from '../../../../models/budget';
import { formatMoney } from '../../../../lib/currency';
import { bullets, dueLabel, namePrefix, weddingDateLine, monthsLeft, firstName } from '../helpers';

/**
 * Intents answered from the couple's own workspace: countdown, budget, RSVPs,
 * the plan. These are the questions a generic chatbot cannot answer and the
 * reason the assistant is inside the app at all.
 */

const noWedding =
  'I do not have your wedding details yet. Finish the short setup and I will be able to answer with your real date, budget and guest list.';

export const workspaceIntents = [
  {
    id: 'greeting',
    patterns: [/^(hi|hello|hey|hiya|namaste|good (morning|afternoon|evening))\b/],
    answer: (ctx) => ({
      content: `Hello${firstName(ctx) ? ` ${firstName(ctx)}` : ''}! I am WeddingGPT, your planning assistant.\n\n${
        weddingDateLine(ctx) ?? ''
      }\n\nAsk me about your budget, guest list, what to do next, wedding etiquette, questions for vendors - or have me draft a message for you.`.replace(/\n\n\n\n/g, '\n\n'),
    }),
  },
  {
    id: 'thanks',
    patterns: [/^(thanks|thank you|thx|ty|great|perfect|awesome|ok thanks)\b/],
    answer: () => ({
      content: 'Happy to help. Anything else on your mind - big or small?',
    }),
  },
  {
    id: 'capabilities',
    patterns: [/what can you (do|help)/, /how (can|do) you help/, /who are you/, /what are you/, /^help$/],
    answer: () => ({
      content: `Here is what I can do:\n\n${bullets([
        '**Your plan** - what to do next, what is overdue, how far along you are',
        '**Budget** - where the money is going, how much is left, how to split it',
        '**Guests** - RSVP counts, guest-list sizing, plus-one and children etiquette',
        '**Checklists** - build a task list for a venue, photographer, attire and more (you review before anything is added)',
        '**Messages** - draft vendor enquiries, RSVP reminders, thank-you notes',
        '**Vendors** - the questions worth asking before you sign',
        '**Emergencies** - rain plans, a vendor cancelling, running over budget',
        '**The app** - how to add guests, change your date, sign out and more',
      ])}\n\nJust ask in your own words.`,
    }),
  },
  {
    id: 'countdown',
    patterns: [/how (many|long).*(days|weeks|months|left|until|till|to go)/, /when is (my|our|the) wedding/, /countdown/, /what is (my|our|the) wedding date/],
    keywords: { days: 1, date: 1 },
    answer: (ctx) => {
      if (!ctx.hasWedding) return { content: noWedding };
      if (!ctx.date.iso) {
        return {
          content:
            'You have not set a date yet - and that is fine. Most couples lock the date once the venue is chosen, since the venue decides which dates are possible.\n\nWhen you have one, add it under your wedding details and I will build your whole timeline around it.',
        };
      }
      const days = ctx.date.daysToGo;
      const weeks = Math.floor(days / 7);
      const extra = ctx.date.exact ? '' : '\n\nThat is counted from an approximate date - set an exact one when you can and the countdown will sharpen.';
      return {
        content: `${weddingDateLine(ctx)} That is about ${weeks} weeks${monthsLeft(ctx) >= 1 ? `, or ${monthsLeft(ctx)} months` : ''}.${
          ctx.planning.nextAction ? `\n\nThe best use of today: **${ctx.planning.nextAction.title}**.` : ''
        }${extra}`,
      };
    },
  },
  {
    id: 'budget_overview',
    priority: 1,
    patterns: [
      /how much (have we|have i|did we|did i)? ?(spent|spend|left|remaining)/,
      /(budget|money).*(left|remaining|status|overview|summary|looking|going)/,
      /where.*(money|budget).*(going|gone)/,
      /(explain|summari[sz]e|show).*(budget)/,
      /are we over budget/,
    ],
    keywords: { budget: 2, spent: 1, remaining: 1 },
    answer: (ctx) => {
      if (!ctx.hasWedding) return { content: noWedding };
      const b = ctx.budget;
      if (!b.isSet) {
        return {
          content:
            'You have not set a total budget yet. Setting one is the single most useful money decision you can make early - every venue and vendor conversation gets easier once you know your number.\n\nOpen **Budget** and tap **Set a budget**. I can suggest how to split it once it is in.',
        };
      }
      const status = b.isOverBudget
        ? `You are **over budget by ${b.remaining.replace('-', '')}**. That is fixable - look at the biggest unpaid commitments first, and ask me "how can we cut costs" for ideas.`
        : b.usedPercent >= 85
          ? 'You have committed most of it - worth pausing before any new bookings.'
          : 'You are in a healthy position.';
      return {
        content: `Here is your budget at a glance:\n\n${bullets([
          `**Total:** ${b.total}`,
          `**Paid so far:** ${b.spent}`,
          `**Committed but unpaid:** ${b.committed}`,
          `**Remaining:** ${b.remaining} (${100 - b.usedPercent}% free)`,
        ])}\n\n${status}${b.expenseCount === 0 ? '\n\nNo expenses logged yet - add each booking under **Budget** as you make it, and these numbers stay honest.' : ''}`,
      };
    },
  },
  {
    id: 'budget_split',
    priority: 2,
    patterns: [/(how|where) (should|do|can) (we|i) (split|allocate|divide|spend)/, /(budget|money) (split|breakdown|allocation)/, /typical (budget|cost)/, /what percent/],
    keywords: { allocate: 2, split: 1, breakdown: 1, percent: 1 },
    answer: (ctx) => {
      const total = ctx.budget?.isSet ? ctx.budget.totalMinor : null;
      const currency = ctx.budget?.currency;
      const lines = DEFAULT_BUDGET_ALLOCATION.map((row) => {
        const pct = Math.round(row.share * 100);
        return total
          ? `**${row.name}** - ${pct}% (about ${formatMoney(Math.round(total * row.share), currency)})`
          : `**${row.name}** - ${pct}%`;
      });
      return {
        content: `A typical split${total ? ` of your ${ctx.budget.total}` : ''} looks like this:\n\n${bullets(lines)}\n\nTreat it as a starting shape, not a rule. Decide your top two priorities - photography, food, the venue - and move money toward them from the rest. Always keep the buffer: something always costs more than quoted.`,
      };
    },
  },
  {
    id: 'budget_saving',
    priority: 2,
    patterns: [/(save|saving|cut|reduce|lower|trim).*(money|cost|budget|spend)/, /(cheap|cheaper|afford|expensive|too costly)/, /over budget.*(what|how)/],
    keywords: { save: 1, cheaper: 2, afford: 2 },
    answer: (ctx) => ({
      content: `${namePrefix(ctx)}the biggest savings come from a few big levers, not lots of small ones:\n\n${bullets([
        '**Guest count** - every guest multiplies food, drink, seating and stationery. Trimming 10% of the list is usually the single largest saving.',
        '**Day and season** - off-season months and weekday or Sunday dates are often noticeably cheaper for venues and vendors.',
        '**Timing of the meal** - a lunch or afternoon reception typically costs less than a late dinner with a full bar.',
        '**Bundle vendors** - venues with in-house catering and decor, or a photographer who also shoots video, often discount the package.',
        '**Negotiate the extras, not the core** - ask for an extra hour of coverage or free delivery rather than a lower headline price.',
        '**Digital save-the-dates** - keep printed stationery for the invitation itself.',
      ])}${ctx.budget?.isOverBudget ? `\n\nYou are currently over by ${ctx.budget.remaining.replace('-', '')}, so start with the guest count and any unpaid bookings you have not signed yet.` : ''}`,
    }),
  },
  {
    id: 'rsvp_status',
    priority: 1,
    patterns: [/rsvp/, /who(s| is)? (coming|attending)/, /how many (people|guests) (are )?(coming|attending|confirmed|replied)/, /(replied|responses|headcount)/],
    keywords: { rsvp: 2, attending: 1, confirmed: 1 },
    answer: (ctx) => {
      if (!ctx.hasWedding) return { content: noWedding };
      const g = ctx.guests;
      if (g.onList === 0) {
        return {
          content: `There is nobody on your guest list yet${g.estimate ? ` (you estimated around ${g.estimate})` : ''}. Start with the people you could not imagine the day without, then work outward. Add them under **Guests** - households keep couples and families together.`,
        };
      }
      return {
        content: `Your RSVPs so far:\n\n${bullets([
          `**Attending:** ${g.attending}${g.headcount > g.attending ? ` (${g.headcount} with plus-ones)` : ''}`,
          `**Declined:** ${g.declined}`,
          `**Still to reply:** ${g.awaiting}`,
          `**Response rate:** ${g.responsePercent}%`,
        ])}\n\n${
          g.awaiting > 0
            ? `A gentle nudge usually brings in most of the rest. Want me to **draft an RSVP reminder**?`
            : 'Everyone has replied - time to send final numbers to your caterer.'
        }`,
      };
    },
  },
  {
    id: 'guest_list_size',
    priority: 1,
    patterns: [/how many (people|guests) (should|to) (we|i)? ?invite/, /(cut|trim|shorten|reduce).*(guest|list)/, /guest list/, /who (should|do) (we|i) invite/],
    keywords: { invite: 1, guest: 1 },
    answer: (ctx) => ({
      content: `A few rules of thumb for the guest list:\n\n${bullets([
        'Start from the venue capacity and budget, not the other way round - a rough cost per head tells you how many you can host.',
        'Expect **15-20% of invited guests to decline** for a local wedding, more for a destination one. Do not invite to fill that gap unless you could host everyone.',
        'Use tiers: must-invite family and friends, then people you would like there, then "if space allows".',
        'A useful test: have you both spoken to them in the last year? Would you invite them to dinner?',
        'Decide plus-one and children policies once, and apply them evenly - exceptions are what cause hurt feelings.',
      ])}${ctx.guests?.estimate ? `\n\nYou estimated around **${ctx.guests.estimate} guests**${ctx.guests.onList ? ` and have ${ctx.guests.onList} on the list so far` : ''}.` : ''}`,
    }),
  },
  {
    id: 'next_steps',
    priority: 1,
    patterns: [/what (should|do|can) (we|i) do (next|now|first|today|this week)/, /(next|first) steps?/, /where (do|should) (we|i) (start|begin)/, /^what (do|should) (i|we) do$/, /^what now$/, /what.s next/, /what (is|are) (my|our) (next|priorit)/, /three months out/, /months (out|before|away)/],
    keywords: { next: 1, start: 1, priority: 1 },
    answer: (ctx) => {
      if (!ctx.hasWedding) return { content: noWedding };
      const p = ctx.planning;
      const parts = [];
      if (p.overdueCount > 0) {
        parts.push(`First, clear what has slipped - **${p.overdueCount} task${p.overdueCount === 1 ? ' is' : 's are'} overdue**:\n\n${bullets(p.overdue.map((t) => `${t.title} - ${dueLabel(t.dueDate)}`))}`);
      }
      // Each task appears once: overdue first, then the next step, then the rest.
      const overdueTitles = new Set(p.overdue.map((t) => t.title));
      if (p.nextAction && !overdueTitles.has(p.nextAction.title)) {
        parts.push(`Your single best next step: **${p.nextAction.title}** - ${dueLabel(p.nextAction.dueDate)}.`);
      } else if (p.nextAction) {
        parts.push(`Start with **${p.nextAction.title}** - it unblocks the most.`);
      }
      const upcoming = p.upcoming.filter(
        (t) => !overdueTitles.has(t.title) && t.title !== p.nextAction?.title
      );
      if (upcoming.length > 0) {
        parts.push(`Coming up in the next month:\n\n${bullets(upcoming.map((t) => `${t.title} - ${dueLabel(t.dueDate)}`))}`);
      }
      const months = monthsLeft(ctx);
      if (months != null) parts.push(stageAdvice(months));
      if (parts.length === 0) {
        parts.push('Your plan is clear right now. Ask me to **make a checklist** for anything coming up - a venue, a photographer, the week of the wedding - and I will draft one for you to review.');
      }
      return { content: parts.join('\n\n') };
    },
  },
  {
    id: 'overdue',
    priority: 2,
    patterns: [/overdue/, /(behind|late|slipped|missed)/, /falling behind/],
    answer: (ctx) => {
      if (!ctx.hasWedding) return { content: noWedding };
      const p = ctx.planning;
      if (p.overdueCount === 0) return { content: 'Nothing is overdue - you are right on track. Well done.' };
      return {
        content: `${p.overdueCount} task${p.overdueCount === 1 ? ' is' : 's are'} overdue:\n\n${bullets(p.overdue.map((t) => `**${t.title}** - ${dueLabel(t.dueDate)}`))}\n\nDo not try to clear them all today. Pick the one that blocks other things (usually anything to do with the venue or date), and **snooze** the rest to realistic dates from the task screen. A plan you believe in beats a red list.`,
      };
    },
  },
  {
    id: 'progress',
    priority: 1,
    patterns: [/how (far|much) (along|done|progress)/, /(progress|on track)/, /how are we doing/],
    answer: (ctx) => {
      if (!ctx.hasWedding) return { content: noWedding };
      const p = ctx.planning;
      return {
        content: `You are **${p.progressPercent}% of the way** through your plan, with ${p.openCount} tasks still open${p.overdueCount ? ` and ${p.overdueCount} overdue` : ' and nothing overdue'}.${
          weddingDateLine(ctx) ? `\n\n${weddingDateLine(ctx)}` : ''
        }${p.nextAction ? `\n\nNext up: **${p.nextAction.title}**.` : ''}`,
      };
    },
  },
  {
    id: 'stress',
    priority: 1,
    patterns: [/(stressed|overwhelm|anxious|panic|worried|scared|too much|cant cope|exhausted|burn(ed|t)? out)/, /(fight|argu).*(partner|family|mom|mum|dad|parents)/],
    answer: (ctx) => {
      const stressors = ctx.stressors?.length ? `\n\nYou mentioned **${ctx.stressors.join(', ').toLowerCase()}** weighing on you when you set up. It is common, and it is manageable.` : '';
      return {
        content: `${namePrefix(ctx)}that is completely normal - wedding planning is a big project layered on top of real life.${stressors}\n\nA few things that genuinely help:\n\n${bullets([
          'Pick **one** task for this week and let the rest wait. Progress beats perfection.',
          'Agree your three non-negotiables as a couple. Everything else can be "good enough".',
          'Hand things off - a parent or friend can own the guest addresses or the favours.',
          'Book a wedding-free evening each week. Nothing planned, nothing discussed.',
        ])}\n\nWant me to look at what is actually urgent, so you can stop carrying the rest in your head? Ask **"what should I do next?"**`,
      };
    },
  },
];

function stageAdvice(months) {
  if (months >= 12) return 'With a year or more to go, focus on the big three: **budget, guest count and venue**. Almost every other decision depends on those.';
  if (months >= 9) return 'At 9-12 months out, book the vendors who get snapped up first: **photographer, caterer and music**. Save-the-dates can go out now for a destination wedding.';
  if (months >= 6) return 'At 6-9 months out, lock in **attire, florist, decor and accommodation blocks**, and send save-the-dates.';
  if (months >= 3) return 'At 3-6 months out: **send invitations** (6-8 weeks before), plan the day-of timeline, book hair and makeup trials, and sort legal paperwork.';
  if (months >= 1) return 'In the last few months: **chase RSVPs, finalise numbers, build the seating plan**, confirm every vendor in writing and pay remaining balances.';
  return 'This is the final stretch. **Confirm every vendor, share the day-of timeline, and pack an emergency kit.** Then hand the logistics to someone you trust and enjoy it.';
}
