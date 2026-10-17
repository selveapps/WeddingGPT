import { DateType } from './enums';
import { toMinor, DEFAULT_CURRENCY } from '../lib/currency';

/**
 * The onboarding script.
 *
 * Five steps, most of them a single tap. Everything else the product could ask
 * up front (stage, ceremony, style, worries, collaboration) is either
 * defaulted or asked later, in context, when it actually changes something.
 * Every step is skippable, and so is the whole flow - the dashboard is built
 * from whatever has been answered, including nothing.
 *
 * Every question is data rather than a screen, so the flow's length, order and
 * copy all change from here. `app/onboarding/index.jsx` renders whichever entry
 * is current.
 *
 * `key` is the draft key the answer is stored under, and those keys are the
 * exact ones `weddingStore.completeOnboarding` reads when it builds the real
 * Wedding entity - the two lists have to stay in step.
 */

/** Input kinds the onboarding journey knows how to render. */
export const StepKind = {
  NAMES: 'names',
  DATE: 'date',
  CHOICE: 'choice',
  LOCATION: 'location',
};

export const GUEST_COUNT_OPTIONS = [
  { value: 20, label: 'Under 30', description: 'Intimate' },
  { value: 50, label: '30 to 70', description: 'Small' },
  { value: 100, label: '70 to 130', description: 'Classic' },
  { value: 175, label: '130 to 220', description: 'Big' },
  { value: 300, label: 'Over 220', description: 'Grand' },
];

/**
 * Budget bands, in US dollars.
 *
 * The stored value is the middle of the band - a starting point they can edit
 * on the Budget screen, not a number we pretend they committed to.
 *
 * Written in major units for legibility and converted once, here, so that
 * everything downstream receives the minor units the money model expects.
 */
const BUDGET_BANDS = {
  USD: [
    { major: 10000, label: 'Under $15k' },
    { major: 22500, label: '$15k to $30k' },
    { major: 40000, label: '$30k to $50k' },
    { major: 75000, label: '$50k to $100k' },
    { major: 150000, label: 'Over $100k' },
  ],
};

export function budgetOptionsFor(currency = DEFAULT_CURRENCY) {
  const bands = BUDGET_BANDS[currency] ?? BUDGET_BANDS[DEFAULT_CURRENCY];
  return [...bands, { major: null, label: 'Not sure yet' }].map(({ major, ...rest }) => ({
    ...rest,
    value: major === null ? null : toMinor(major, currency),
  }));
}

/** The default currency's bands. Prefer `budgetOptionsFor(currency)`. */
export const BUDGET_OPTIONS = budgetOptionsFor(DEFAULT_CURRENCY);

/**
 * Worries a couple can name. No longer asked during onboarding - it was the
 * densest screen in the flow - but kept as the vocabulary for `wedding.stressors`
 * so the assistant can still read them once they are captured elsewhere.
 */
export const STRESSOR_OPTIONS = [
  { value: 'budget', label: 'Staying on budget' },
  { value: 'family', label: 'Family expectations' },
  { value: 'guests', label: 'The guest list' },
  { value: 'time', label: 'Finding the time' },
  { value: 'decisions', label: 'Too many decisions' },
  { value: 'vendors', label: 'Finding good vendors' },
  { value: 'logistics', label: 'Day-of logistics' },
  { value: 'nothing', label: 'Honestly, nothing yet' },
];

/**
 * The steps, in order.
 *
 * `say` is what the companion says - one short line, never a paragraph. It is
 * a function of the draft so later steps can use the name given on the first.
 * `hint` is optional and shorter still. `options` is a list, or a function of
 * the draft when the choices depend on an earlier answer.
 */
export const ONBOARDING_STEPS = [
  {
    id: 'names',
    kind: StepKind.NAMES,
    say: () => 'First things first. What should I call you?',
    mood: 'wave',
    hint: 'You can invite your partner later.',
  },
  {
    id: 'date',
    key: 'weddingDate',
    kind: StepKind.DATE,
    say: (draft) =>
      draft?.firstName?.trim()
        ? `Lovely to meet you, ${draft.firstName.trim()}! When is the big day?`
        : 'When is the big day?',
    hint: 'A rough idea is plenty.',
    mood: 'think',
  },
  {
    id: 'location',
    key: 'city',
    kind: StepKind.LOCATION,
    say: () => 'Where are you celebrating?',
    hint: 'I will find vendors near you. Skip it if you are not sure yet.',
    mood: 'think',
  },
  {
    id: 'guests',
    key: 'guestCount',
    kind: StepKind.CHOICE,
    say: () => 'How many guests are you picturing?',
    options: GUEST_COUNT_OPTIONS,
  },
  {
    id: 'budget',
    key: 'budgetTotal',
    kind: StepKind.CHOICE,
    say: () => 'Last one! Roughly what is the budget?',
    mood: 'celebrate',
    hint: 'You can change it any time.',
    options: BUDGET_OPTIONS,
  },
];

export const ONBOARDING_STEP_COUNT = ONBOARDING_STEPS.length;

/** Clamp any incoming step index to a real step. Guards hand-typed URLs. */
export function clampStepIndex(index) {
  const parsed = Number.parseInt(index, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(Math.max(parsed, 0), ONBOARDING_STEP_COUNT - 1);
}

export function stepAt(index) {
  return ONBOARDING_STEPS[clampStepIndex(index)];
}

/** The date-precision choices offered on the date step. */
export const DATE_TYPE_OPTIONS = [
  { value: DateType.EXACT, label: 'We have a date', icon: 'calendar' },
  { value: DateType.MONTH, label: 'We know the month', icon: 'clock' },
  { value: DateType.SEASON, label: 'Roughly a season', icon: 'sparkle' },
  { value: DateType.UNDECIDED, label: 'Not decided yet', icon: 'heart' },
];

/** Seasons offered when the couple picks SEASON, mapped to a mid-season month. */
export const SEASON_OPTIONS = [
  { value: 1, label: 'Jan to Mar' },
  { value: 4, label: 'Apr to Jun' },
  { value: 7, label: 'Jul to Sep' },
  { value: 10, label: 'Oct to Dec' },
];
