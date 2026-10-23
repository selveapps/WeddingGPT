import { RsvpStatus, RSVP_STATUS_META, PaymentStatus, ExpenseCommitment, SuggestionType } from './enums';
import { guestFullName } from './guests';
import { formatMoney } from '../lib/currency';
import { formatMediumDate } from '../lib/date';
import { findDate } from '../lib/textDates';
import { findAmounts } from '../lib/textMoney';

/**
 * Assistant actions (graduated from Labs).
 *
 * Turns a plain request - "add a $2,000 florist expense", "mark the Smiths as
 * attending", "remind me to call the DJ by March 3" - into a proposed change
 * the couple reads before anything happens. This is the s.13 rule the
 * assistant already follows (the AI suggests, the couple confirms), extended
 * from tasks and messages to the budget and the guest list.
 *
 * Rule-based on purpose: it runs on the phone, offline, and is predictable.
 * It needs the guest list to know who "the Smiths" are, which is exactly what
 * the assistant is never sent, so the AI store runs it before any provider
 * (see `actionReply`), and the request never leaves the phone.
 */

export const ActionKind = {
  ADD_EXPENSE: 'add_expense',
  SET_RSVP: 'set_rsvp',
  ADD_TASK: 'add_task',
  UNKNOWN: 'unknown',
};

export const EXAMPLES = [
  'Add a $2,000 florist expense',
  'Spent $450 on the cake',
  'Mark the Smiths as attending',
  'Jane Doe declined',
  'Remind me to call the DJ by March 3',
  'Add task book the hair trial next week',
];

// --- Guests -------------------------------------------------------------------

const STATUS_WORDS = [
  {
    re: /^(not coming|can'?t come|cannot come|won'?t come|declined?|declines|said no|rsvp'?d no|no|regrets)$/i,
    status: RsvpStatus.DECLINED,
  },
  {
    re: /^(attending|coming|accepted|accepts|said yes|rsvp'?d yes|yes|will come)$/i,
    status: RsvpStatus.ATTENDING,
  },
  { re: /^(maybe|unsure|not sure)$/i, status: RsvpStatus.MAYBE },
];

const STATUS_ALT =
  "not coming|can'?t come|cannot come|won'?t come|declined?|declines|said no|rsvp'?d no|regrets|attending|coming|accepted|accepts|said yes|rsvp'?d yes|will come|maybe|unsure|not sure|yes|no";

const RSVP_PATTERNS = [
  new RegExp(`^(?:mark|set|put)\\s+(.+?)\\s+(?:as\\s+|to\\s+)?(${STATUS_ALT})\\b`, 'i'),
  new RegExp(`^(.+?)\\s+(?:is|are|will be)\\s+(${STATUS_ALT})\\b`, 'i'),
  new RegExp(`^(.+?)\\s+(${STATUS_ALT})\\s*[.!]?$`, 'i'),
];

function statusFrom(word) {
  return STATUS_WORDS.find((entry) => entry.re.test(word.trim()))?.status ?? null;
}

/**
 * Who does "the Smiths", "Smith family", "Jane Doe" or "Jane" mean? Full
 * name first, then a unique first name, then everyone with that last name.
 */
export function matchGuests(phrase, guests = []) {
  const cleaned = phrase
    .toLowerCase()
    .replace(/^(the|our|my)\s+/, '')
    .replace(/\s+(family|household|party)$/, '')
    .trim();
  if (!cleaned) return [];

  const full = guests.filter((guest) => guestFullName(guest).toLowerCase() === cleaned);
  if (full.length) return full;

  const first = guests.filter((guest) => (guest.firstName ?? '').toLowerCase() === cleaned);
  if (first.length === 1) return first;

  const surname = cleaned.replace(/(?<=[a-z])(es|s)$/, '');
  const byLast = guests.filter((guest) => {
    const last = (guest.lastName ?? '').toLowerCase();
    return last && (last === cleaned || last === surname || `${last}s` === cleaned);
  });
  if (byLast.length) return byLast;

  return first;
}

function parseRsvp(text, guests) {
  for (const pattern of RSVP_PATTERNS) {
    const match = pattern.exec(text);
    if (!match) continue;
    const status = statusFrom(match[2]);
    if (!status) continue;
    const who = match[1].trim();
    const matched = matchGuests(who, guests);
    const label = RSVP_STATUS_META[status].label.toLowerCase();
    return {
      kind: ActionKind.SET_RSVP,
      payload: { guestIds: matched.map((guest) => guest.id), rsvpStatus: status },
      summary: matched.length
        ? `Mark ${matched.map(guestFullName).join(', ')} as ${label}`
        : `No guest called "${who}"`,
      warnings: matched.length ? [] : ['Check the name matches your guest list.'],
      ready: matched.length > 0,
    };
  }
  return null;
}

// --- Tasks --------------------------------------------------------------------

const TASK_PREFIX =
  /^(?:please\s+)?(?:remind me to|remind us to|add (?:a )?task(?: to)?:?|to-?do:?|i need to|we need to|don'?t forget to)\s+(.+)$/i;
const DATE_LEAD = /\s+(?:by|on|before|due)\s*$/i;

function parseTask(text, from) {
  const match = TASK_PREFIX.exec(text);
  if (!match) return null;
  let title = match[1].trim();
  const date = findDate(title, from);
  if (date) {
    title = `${title.slice(0, date.index)}${title.slice(date.index + date.raw.length)}`
      .replace(/\s{2,}/g, ' ')
      .trim()
      .replace(DATE_LEAD, '')
      .trim();
  }
  title = title.replace(/[.!]+$/, '');
  title = title.charAt(0).toUpperCase() + title.slice(1);
  return {
    kind: ActionKind.ADD_TASK,
    payload: { title, dueDate: date?.iso ?? null },
    summary: `Add task "${title}"${date ? `, due ${formatMediumDate(date.iso)}` : ''}`,
    warnings: [],
    ready: Boolean(title),
  };
}

// --- Expenses -----------------------------------------------------------------

/** Words people use for each default budget category key. */
const CATEGORY_WORDS = {
  venue: ['venue', 'hall', 'rental', 'rentals', 'chairs', 'tent', 'tables'],
  catering: ['caterer', 'catering', 'food', 'bar', 'drinks', 'cake', 'dessert', 'desserts'],
  photo: ['photographer', 'photography', 'photo', 'photos', 'video', 'videographer'],
  attire: ['dress', 'gown', 'suit', 'tux', 'tuxedo', 'attire', 'hair', 'makeup', 'shoes', 'veil'],
  decor: ['florist', 'flowers', 'floral', 'decor', 'centerpieces', 'bouquet'],
  music: ['dj', 'band', 'music', 'musician', 'musicians', 'singer'],
  stationery: ['invitations', 'invites', 'stationery', 'cards', 'programs'],
  rings: ['ring', 'rings'],
  transport: ['transport', 'limo', 'car', 'bus', 'shuttle', 'hotel', 'flights'],
};

const EXPENSE_VERB = /\b(add|spent|spend|paid|pay|expense|cost|costs|deposit|bought|quote)\b/i;
const PAID_VERB = /\b(spent|paid|bought)\b/i;
const FILLER = new Set([
  'add',
  'an',
  'a',
  'the',
  'expense',
  'spent',
  'spend',
  'on',
  'for',
  'paid',
  'pay',
  'to',
  'we',
  'i',
  'our',
  'my',
  'of',
  'cost',
  'costs',
  'bought',
  'just',
  'new',
]);

export function matchCategory(words, categories = []) {
  for (const word of words) {
    const key = Object.keys(CATEGORY_WORDS).find((k) => CATEGORY_WORDS[k].includes(word));
    if (!key) continue;
    const category =
      categories.find((c) => c.key === key) ?? categories.find((c) => c.name?.toLowerCase().includes(word));
    if (category) return category;
  }
  return null;
}

function parseExpense(text, { categories, from }) {
  if (!EXPENSE_VERB.test(text)) return null;
  const date = findDate(text, from);
  const amounts = findAmounts(text).filter(
    (amount) =>
      !date || amount.index + amount.raw.length <= date.index || amount.index >= date.index + date.raw.length
  );
  const amount = amounts.find((entry) => entry.explicit) ?? amounts[0];
  if (!amount || amount.minor <= 0) return null;

  let rest = `${text.slice(0, amount.index)} ${text.slice(amount.index + amount.raw.length)}`;
  if (date) rest = rest.replace(date.raw, ' ');
  const words = rest
    .toLowerCase()
    .replace(/[^a-z0-9' ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const meaningful = words.filter((word) => !FILLER.has(word));
  const titleWords = meaningful.length ? meaningful : ['expense'];
  const title = titleWords.join(' ').replace(/^./, (c) => c.toUpperCase());
  const category = matchCategory(words, categories);
  const paid = PAID_VERB.test(text);

  return {
    kind: ActionKind.ADD_EXPENSE,
    payload: {
      title,
      amount: amount.minor,
      paidAmount: paid ? amount.minor : 0,
      paymentStatus: paid ? PaymentStatus.PAID : PaymentStatus.UNPAID,
      commitment: paid ? ExpenseCommitment.COMMITTED : ExpenseCommitment.ESTIMATED,
      budgetCategoryId: category?.id ?? null,
      date: paid ? (date?.iso ?? null) : null,
      dueDate: paid ? null : (date?.iso ?? null),
    },
    summary: `${paid ? 'Record' : 'Add'} ${formatMoney(amount.minor)} "${title}"${category ? ` under ${category.name}` : ''}${paid ? ' as paid' : ''}`,
    warnings: category ? [] : ['No budget category matched - it will be uncategorised.'],
    ready: true,
  };
}

/**
 * Parse one request. Order matters: RSVPs have no amounts, task phrasing is
 * explicit, and anything with money and a spending verb is an expense.
 */
export function parseCommand(text, { guests = [], categories = [], from = new Date() } = {}) {
  const input = (text ?? '').trim();
  if (!input) return null;

  return (
    parseTask(input, from) ??
    parseRsvp(input, guests) ??
    parseExpense(input, { categories, from }) ?? {
      kind: ActionKind.UNKNOWN,
      payload: null,
      summary: 'Not sure what to do with that',
      warnings: ['Try one of the examples - an expense, an RSVP, or a reminder.'],
      ready: false,
    }
  );
}

/**
 * A ready action as an assistant reply with a proposal, in the shape the AI
 * store turns into a suggestion card. Null for anything not understood, so
 * the message goes to the assistant as usual.
 */
export function actionReply(action) {
  if (!action || action.kind === ActionKind.UNKNOWN) return null;
  if (!action.ready) {
    return { content: `${action.summary}. ${action.warnings.join(' ')}`.trim(), proposal: null };
  }
  const note = action.warnings.length
    ? `

${action.warnings.join(' ')}`
    : '';
  const ask = 'Check it below - nothing changes until you confirm.';

  if (action.kind === ActionKind.ADD_TASK) {
    return {
      content: `I can add that to your plan. ${ask}${note}`,
      proposal: {
        type: SuggestionType.CREATE_TASKS,
        title: action.payload.title,
        summary: action.summary,
        payload: { tasks: [{ title: action.payload.title, dueDate: action.payload.dueDate }] },
      },
    };
  }
  if (action.kind === ActionKind.ADD_EXPENSE) {
    return {
      content: `Here is the expense. ${ask}${note}`,
      proposal: {
        type: SuggestionType.ADD_EXPENSE,
        title: action.summary,
        summary: action.summary,
        payload: action.payload,
      },
    };
  }
  return {
    content: `Here is the RSVP change. ${ask}${note}`,
    proposal: {
      type: SuggestionType.UPDATE_GUEST,
      title: action.summary,
      summary: action.summary,
      payload: action.payload,
    },
  };
}

const EXPLICIT_RSVP = /^(?:mark|set|put)\s/i;

/**
 * What the chat does with a message before the assistant sees it. Stricter
 * than `parseCommand`, because a wrong guess here hides the assistant's
 * answer: questions always go to the assistant, and an RSVP change that
 * matches no guest only gets a reply when it was clearly meant as one.
 */
export function deviceActionReply(text, data = {}) {
  const input = String(text ?? '').trim();
  if (!input || input.includes('?')) return null;
  const action = parseCommand(input, data);
  if (!action || action.kind === ActionKind.UNKNOWN) return null;
  if (action.kind === ActionKind.SET_RSVP && !action.ready && !EXPLICIT_RSVP.test(input)) return null;
  return actionReply(action);
}
