import { DateType, CeremonyType, PlanningStage, PLANNING_STAGE_META, CEREMONY_TYPE_META } from './enums';
import { WEDDING_STYLES } from './vision';
import { toMinor } from '../lib/currency';

/**
 * The onboarding script (PRD s.4.2).
 *
 * Every question is data rather than a screen, because the PRD asks for one
 * meaningful question per screen and eleven near-identical files would drift
 * apart within a week. `app/onboarding/[step].jsx` renders whichever entry the
 * URL points at, so the flow's length, order and copy all change from here.
 *
 * `key` is the draft key the answer is stored under, and those keys are the
 * exact ones `weddingStore.completeOnboarding` reads when it builds the real
 * Wedding entity - the two lists have to stay in step.
 */

/** Input kinds `[step].jsx` knows how to render. */
export const StepKind = {
  TEXT: 'text',
  DATE: 'date',
  CHOICE: 'choice',
  MULTI: 'multi',
};

export const GUEST_COUNT_OPTIONS = [
  { value: 20, label: 'Under 30', description: 'Just the people who matter most.' },
  { value: 50, label: '30 to 70', description: 'Small, and everyone knows each other.' },
  { value: 100, label: '70 to 130', description: 'The usual shape of a wedding.' },
  { value: 175, label: '130 to 220', description: 'A big day, with real logistics.' },
  { value: 300, label: 'Over 220', description: 'A celebration on a serious scale.' },
];

/**
 * Budget bands.
 *
 * The stored value is the middle of the band - a starting point they can edit
 * on the Budget screen, not a number we pretend they committed to.
 *
 * Written in major units for legibility and converted once, here, so that
 * everything downstream receives the minor units the money model expects and
 * no screen has to remember which unit it is holding.
 */
export const BUDGET_OPTIONS = [
  { major: 300000, label: 'Under 5 lakh', description: 'Careful, and entirely doable.' },
  { major: 750000, label: '5 to 10 lakh', description: 'Room to choose where it matters.' },
  { major: 1500000, label: '10 to 20 lakh', description: 'Comfortable across the board.' },
  { major: 3500000, label: '20 to 50 lakh', description: 'Generous, with proper scope.' },
  { major: 7500000, label: 'Over 50 lakh', description: 'No serious constraint.' },
  { major: null, label: 'Still working it out', description: 'We will suggest a structure later.' },
].map(({ major, ...rest }) => ({ ...rest, value: major === null ? null : toMinor(major) }));

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
 * `optional: true` puts a Skip control on the screen (PRD s.4.2). Name and date
 * are not optional: everything the product does afterwards - the countdown, the
 * generated plan, the greeting - is built from them.
 */
export const ONBOARDING_STEPS = [
  {
    id: 'name',
    key: 'firstName',
    kind: StepKind.TEXT,
    eyebrow: 'First, the basics',
    question: 'What should we call you?',
    help: 'We will use it to make this feel like yours rather than an app.',
    placeholder: 'Your first name',
    autoCapitalize: 'words',
    required: true,
  },
  {
    id: 'partner',
    key: 'partnerName',
    kind: StepKind.TEXT,
    eyebrow: 'And the other half',
    question: 'Who are you marrying?',
    help: 'Their first name is plenty.',
    placeholder: "Your partner's first name",
    autoCapitalize: 'words',
    required: true,
  },
  {
    id: 'date',
    key: 'weddingDate',
    kind: StepKind.DATE,
    eyebrow: 'The day itself',
    question: 'When is the wedding?',
    help: 'An exact date if you have one. A rough window is genuinely enough to start.',
  },
  {
    id: 'place',
    key: 'city',
    kind: StepKind.TEXT,
    eyebrow: 'Where it happens',
    question: 'Which city are you planning in?',
    help: 'It shapes the timelines we suggest and, later, the vendors we look for.',
    placeholder: 'City or region',
    autoCapitalize: 'words',
    optional: true,
  },
  {
    id: 'guests',
    key: 'guestCount',
    kind: StepKind.CHOICE,
    eyebrow: 'The room',
    question: 'Roughly how many people?',
    help: 'A ballpark is fine. Nearly every other decision scales off this number.',
    options: GUEST_COUNT_OPTIONS,
    optional: true,
  },
  {
    id: 'budget',
    key: 'budgetTotal',
    kind: StepKind.CHOICE,
    eyebrow: 'The money',
    question: 'What are you working with?',
    help: 'We will turn this into a starting split across every category. You can change all of it.',
    options: BUDGET_OPTIONS,
    optional: true,
  },
  {
    id: 'stage',
    key: 'planningStage',
    kind: StepKind.CHOICE,
    eyebrow: 'Where you are',
    question: 'How far along are you?',
    help: 'This decides how much of the checklist we hand you on day one.',
    options: Object.entries(PLANNING_STAGE_META).map(([value, meta]) => ({
      value,
      label: meta.label,
      description: meta.description,
    })),
    defaultValue: PlanningStage.JUST_ENGAGED,
  },
  {
    id: 'ceremony',
    key: 'ceremonyType',
    kind: StepKind.CHOICE,
    eyebrow: 'The shape of the day',
    question: 'What are you planning?',
    help: 'It changes the timeline more than you would expect.',
    options: Object.entries(CEREMONY_TYPE_META).map(([value, meta]) => ({
      value,
      label: meta.label,
    })),
    defaultValue: CeremonyType.UNDECIDED,
    optional: true,
  },
  {
    id: 'style',
    key: 'styleTags',
    kind: StepKind.MULTI,
    eyebrow: 'The feeling',
    question: 'What are you drawn to?',
    help: 'Pick as many as you like. Contradicting yourself is allowed and fairly normal.',
    options: WEDDING_STYLES.map((style) => ({
      value: style.key,
      label: style.name,
      description: style.blurb,
    })),
    optional: true,
  },
  {
    id: 'stressors',
    key: 'stressors',
    kind: StepKind.MULTI,
    eyebrow: 'Being honest',
    question: 'What is worrying you most?',
    help: 'We will keep it in view rather than pretend it is not there.',
    options: STRESSOR_OPTIONS,
    optional: true,
  },
  {
    id: 'partner_collab',
    key: 'partnerWillCollaborate',
    kind: StepKind.CHOICE,
    eyebrow: 'Last one',
    question: 'Will you be planning together?',
    help: 'Tasks can be assigned either way. You can invite them whenever you are ready.',
    options: [
      { value: true, label: 'Yes, both of us', description: 'We will share the load.' },
      { value: false, label: 'Mostly me', description: 'I am driving this one.' },
    ],
    optional: true,
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

/**
 * Is this answer good enough to move on?
 * Optional steps always pass; required ones need something that is not blank.
 */
export function isStepAnswered(step, value) {
  if (!step?.required) return true;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined;
}

/** The date-precision choices offered on the date step. */
export const DATE_TYPE_OPTIONS = [
  { value: DateType.EXACT, label: 'We have a date', description: 'Day, month and year.' },
  { value: DateType.MONTH, label: 'We know the month', description: 'Close enough to count down.' },
  { value: DateType.SEASON, label: 'A rough season', description: 'Sometime around then.' },
  { value: DateType.UNDECIDED, label: 'Not decided yet', description: 'We will plan by stage instead.' },
];

/** Seasons offered when the couple picks SEASON, mapped to a mid-season month. */
export const SEASON_OPTIONS = [
  { value: 1, label: 'Early in the year', description: 'January to March' },
  { value: 4, label: 'Spring', description: 'April to June' },
  { value: 7, label: 'Monsoon or midsummer', description: 'July to September' },
  { value: 10, label: 'Late in the year', description: 'October to December' },
];
