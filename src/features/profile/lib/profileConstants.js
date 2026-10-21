/**
 * Static copy, section ids and option lists for the Profile screen.
 *
 * Kept out of the React tree so the form, helpers and validation can share the
 * same vocabulary without importing components, and so product copy can be
 * tuned in one place without hunting through JSX.
 */

import {
  CeremonyType,
  CEREMONY_TYPE_META,
  PlanningStage,
  PLANNING_STAGE_META,
  DateType,
  WEDDING_STYLES,
  STRESSOR_OPTIONS,
  GUEST_COUNT_OPTIONS,
} from '@/models';

/** Top-level sections rendered by `ProfileForm`, in display order. */
export const PROFILE_SECTIONS = {
  PERSONAL: 'personal',
  PARTNER: 'partner',
  WEDDING: 'wedding',
  VISION: 'vision',
};

export const PROFILE_SECTION_META = {
  [PROFILE_SECTIONS.PERSONAL]: {
    id: PROFILE_SECTIONS.PERSONAL,
    eyebrow: 'About you',
    title: 'Your details',
    subtitle: 'How we greet you and how we reach you.',
    icon: 'user',
  },
  [PROFILE_SECTIONS.PARTNER]: {
    id: PROFILE_SECTIONS.PARTNER,
    eyebrow: 'The two of you',
    title: 'Your partner',
    subtitle: 'A name for the dashboard, and an invite when you are ready.',
    icon: 'heart',
  },
  [PROFILE_SECTIONS.WEDDING]: {
    id: PROFILE_SECTIONS.WEDDING,
    eyebrow: 'The day',
    title: 'Wedding details',
    subtitle: 'Date, place, scale and stage - the facts the plan leans on.',
    icon: 'calendar',
  },
  [PROFILE_SECTIONS.VISION]: {
    id: PROFILE_SECTIONS.VISION,
    eyebrow: 'The feeling',
    title: 'Style and focus',
    subtitle: 'What you are drawn to, and what weighs on you.',
    icon: 'sparkle',
  },
};

/**
 * Fields the completeness meter cares about.
 * Weight is relative: a missing wedding date hurts the score more than a phone.
 */
export const PROFILE_COMPLETENESS_FIELDS = [
  { key: 'ownerName', label: 'Your name', weight: 2, section: PROFILE_SECTIONS.PERSONAL },
  { key: 'email', label: 'Email', weight: 1, section: PROFILE_SECTIONS.PERSONAL },
  { key: 'phone', label: 'Phone', weight: 1, section: PROFILE_SECTIONS.PERSONAL },
  { key: 'partnerName', label: 'Partner name', weight: 2, section: PROFILE_SECTIONS.PARTNER },
  { key: 'date', label: 'Wedding date', weight: 3, section: PROFILE_SECTIONS.WEDDING },
  { key: 'city', label: 'City', weight: 2, section: PROFILE_SECTIONS.WEDDING },
  { key: 'guestCountEstimate', label: 'Guest count', weight: 1, section: PROFILE_SECTIONS.WEDDING },
  { key: 'budgetTotal', label: 'Budget', weight: 2, section: PROFILE_SECTIONS.WEDDING },
  { key: 'ceremonyType', label: 'Ceremony type', weight: 1, section: PROFILE_SECTIONS.WEDDING },
  { key: 'planningStage', label: 'Planning stage', weight: 1, section: PROFILE_SECTIONS.WEDDING },
  { key: 'styleTags', label: 'Style', weight: 1, section: PROFILE_SECTIONS.VISION },
];

export const DATE_TYPE_OPTIONS = [
  { value: DateType.EXACT, label: 'Exact day', description: 'We know the date' },
  { value: DateType.MONTH, label: 'Month', description: 'Around a month' },
  { value: DateType.SEASON, label: 'Season', description: 'Spring, summer…' },
  { value: DateType.YEAR, label: 'Year', description: 'Sometime that year' },
  { value: DateType.UNDECIDED, label: 'Not sure', description: 'Still deciding' },
];

export const CEREMONY_OPTIONS = Object.entries(CEREMONY_TYPE_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

export const PLANNING_STAGE_OPTIONS = Object.entries(PLANNING_STAGE_META).map(([value, meta]) => ({
  value,
  label: meta.label,
  description: meta.description,
}));

export const STYLE_OPTIONS = WEDDING_STYLES.map((style) => ({
  value: style.key,
  label: style.name,
  description: style.blurb,
}));

export const STRESSOR_FIELD_OPTIONS = STRESSOR_OPTIONS.filter((option) => option.value !== 'nothing');

export const GUEST_COUNT_FIELD_OPTIONS = GUEST_COUNT_OPTIONS;

/** Soft ceiling so a typo cannot invent a stadium wedding. */
export const MAX_GUEST_COUNT = 2000;

/** Soft ceiling on free-text notes that may land on the profile later. */
export const MAX_PROFILE_NOTE_LENGTH = 500;

export const PROFILE_COPY = {
  screenEyebrow: 'Account',
  screenTitle: 'Profile',
  screenSubtitle: 'The people, place and shape of your wedding.',
  heroEmptyName: 'Your wedding',
  heroEmptyPartner: 'Add your partner',
  saveLabel: 'Save changes',
  savingLabel: 'Saving…',
  discardLabel: 'Discard',
  editLabel: 'Edit',
  doneLabel: 'Done',
  dirtyHint: 'You have unsaved changes.',
  savedToast: 'Profile updated',
  discardedToast: 'Changes discarded',
  emptyWeddingToast: 'Set up your wedding first, then come back to refine the details.',
  completenessTitle: 'Profile strength',
  completenessSubtitle: (pct) =>
    pct >= 90
      ? 'Looking complete - the assistant has plenty to work with.'
      : pct >= 60
        ? 'Solid start. A few more details will sharpen your plan.'
        : 'Add the basics and everything else gets easier.',
  settingsEyebrow: 'More',
  settingsTitle: 'Settings',
  settingsSubtitle: 'Reminders, privacy and the rest of your account.',
  dangerEyebrow: 'Careful',
  dangerTitle: 'Reset this device',
  dangerSubtitle:
    'Clears the wedding workspace stored on this phone. There is no undo once you confirm.',
  dangerButton: 'Reset wedding data',
  dangerConfirmTitle: 'Reset everything on this device?',
  dangerConfirmMessage:
    'Tasks, guests, budget and your profile will be wiped from this phone. This cannot be undone.',
  dangerConfirmLabel: 'Yes, reset everything',
  dangerSuccessToast: 'Workspace cleared',
  partnerInviteHint: 'Shared editing from two phones arrives with online accounts. For now, a name is enough.',
  collaborationLabel: 'Planning together',
  collaborationHelper: 'We will phrase tasks and reminders as something you share.',
};

/** Links shown under the form. Paths come from `Routes` at render time. */
export const PROFILE_SETTINGS_LINKS = [
  {
    id: 'bookings',
    icon: 'vendors',
    title: 'Vendor bookings',
    subtitle: 'Quotes, conversations and the vendors you have locked in.',
    routeKey: 'bookings',
  },
  {
    id: 'notifications',
    icon: 'bell',
    title: 'Reminders',
    subtitle: 'What I nudge you about, and when.',
    routeKey: 'notifications',
  },
  {
    id: 'wedding',
    icon: 'calendar',
    title: 'Wedding overview',
    subtitle: 'A read-only glance at the day as it stands.',
    routeKey: 'weddingDetails',
    /** Hidden until that screen ships; kept here so the list is the source of truth. */
    enabled: false,
  },
  {
    id: 'subscription',
    icon: 'sparkle',
    title: 'WeddingGPT Plus',
    subtitle: 'Premium planning tools, when you want them.',
    routeKey: 'subscription',
    enabled: false,
  },
  {
    id: 'privacy',
    icon: 'settings',
    title: 'Privacy',
    subtitle: 'What stays on this device, and what never leaves.',
    routeKey: 'privacy',
    enabled: false,
  },
];

/**
 * Placeholder strings shown in empty fields. Written as examples rather than
 * instructions so the form never sounds like a tutorial.
 */
export const PROFILE_PLACEHOLDERS = {
  ownerName: 'Asha',
  email: 'you@example.com',
  phone: 'Optional',
  partnerName: 'Rahul',
  partnerEmail: 'Optional',
  city: 'Austin',
  region: 'Texas',
  country: 'United States',
  venueName: 'Optional for now',
  guestCount: 'e.g. 120',
};

/** Defaults used when the store has no wedding yet - keeps the form mountable. */
export const EMPTY_PROFILE_VALUES = {
  ownerName: '',
  email: '',
  phone: '',
  partnerName: '',
  partnerEmail: '',
  collaborationEnabled: false,
  date: null,
  dateType: DateType.UNDECIDED,
  city: '',
  region: '',
  country: '',
  venueName: '',
  guestCountEstimate: null,
  budgetTotal: null,
  currency: 'USD',
  planningStage: PlanningStage.JUST_ENGAGED,
  ceremonyType: CeremonyType.UNDECIDED,
  styleTags: [],
  stressors: [],
};

export { CeremonyType, PlanningStage, DateType };

/**
 * Short labels for the section switcher above the form. Kept to one or two
 * words so four segments fit on a phone without truncating.
 */
export const PROFILE_SECTION_TABS = [
  { value: PROFILE_SECTIONS.PERSONAL, label: 'You' },
  { value: PROFILE_SECTIONS.PARTNER, label: 'Partner' },
  { value: PROFILE_SECTIONS.WEDDING, label: 'The day' },
  { value: PROFILE_SECTIONS.VISION, label: 'Style' },
];

/**
 * Friendly prompts for each missing completeness field. Shared by the
 * completeness card and the tips list so the wording never drifts apart.
 */
export const PROFILE_TIP_COPY = {
  ownerName: {
    title: 'Add your name',
    subtitle: 'So greetings and the dashboard feel like yours.',
  },
  email: {
    title: 'Add an email',
    subtitle: 'Optional, and kept on this device for now.',
  },
  phone: {
    title: 'Add a phone number',
    subtitle: 'Handy later for vendors and day-of contacts.',
  },
  partnerName: {
    title: 'Name your partner',
    subtitle: 'The home screen will greet you both.',
  },
  date: {
    title: 'Set the wedding date',
    subtitle: 'Even a rough month unlocks the countdown and pacing.',
  },
  city: {
    title: 'Add your city',
    subtitle: 'Local venue and vendor picks need a place to search near.',
  },
  guestCountEstimate: {
    title: 'Estimate your guest count',
    subtitle: 'A band is enough - it shapes budget and seating later.',
  },
  budgetTotal: {
    title: 'Set a starting budget',
    subtitle: 'A number you can change. The Budget tab will refine it.',
  },
  ceremonyType: {
    title: 'Choose the kind of celebration',
    subtitle: 'Ceremony, reception, multi-day - it tunes the checklist.',
  },
  planningStage: {
    title: 'Say where you are in planning',
    subtitle: 'Early or final stretch changes what I nudge you about.',
  },
  styleTags: {
    title: 'Pick a style or two',
    subtitle: 'Helps inspiration and how the assistant talks about your day.',
  },
};

/** Extra copy used by the redesigned profile layout. */
export const PROFILE_LAYOUT_COPY = {
  editEyebrow: 'Edit',
  editTitle: 'Your profile',
  editSubtitle: 'Pick a section to update. Changes save together.',
  snapshotEyebrow: 'At a glance',
  snapshotTitle: 'Wedding snapshot',
  snapshotSubtitle: 'Tap anything that still needs a detail.',
  nextUpLabel: 'Next up',
  completeTitle: 'Your profile is all set',
  completeSubtitle: 'You can still refine names, style and focus any time.',
  soonLabel: 'Soon',
  statDays: 'Days to go',
  statGuests: 'Guests',
  statBudget: 'Budget',
  statEmpty: '—',
};

