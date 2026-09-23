/**
 * Every status enum in the product.
 *
 * PRD s.22 requires explicit status enums rather than free strings or booleans.
 * Each enum is paired with an `*_META` map giving the label and badge tone, so
 * a status renders identically everywhere without each screen inventing its own
 * copy and colour for "awaiting reply".
 */

// --- Onboarding --------------------------------------------------------------
export const OnboardingStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

export const PlanningStage = {
  JUST_ENGAGED: 'just_engaged',
  EARLY_PLANNING: 'early_planning',
  DEEP_IN_IT: 'deep_in_it',
  FINAL_STRETCH: 'final_stretch',
  ALMOST_THERE: 'almost_there',
};

export const PLANNING_STAGE_META = {
  [PlanningStage.JUST_ENGAGED]: {
    label: 'Just engaged',
    description: 'Still floating. Nothing booked yet.',
  },
  [PlanningStage.EARLY_PLANNING]: {
    label: 'Early planning',
    description: 'Setting a date and a budget.',
  },
  [PlanningStage.DEEP_IN_IT]: {
    label: 'Deep in it',
    description: 'Venue and vendors in motion.',
  },
  [PlanningStage.FINAL_STRETCH]: {
    label: 'Final stretch',
    description: 'Details, seating and timelines.',
  },
  [PlanningStage.ALMOST_THERE]: {
    label: 'Almost there',
    description: 'Weeks away. Tying off loose ends.',
  },
};

/** How precisely the couple knows their date. Drives countdown copy. */
export const DateType = {
  EXACT: 'exact',
  MONTH: 'month',
  SEASON: 'season',
  YEAR: 'year',
  UNDECIDED: 'undecided',
};

export const CeremonyType = {
  CEREMONY_AND_RECEPTION: 'ceremony_and_reception',
  CEREMONY_ONLY: 'ceremony_only',
  RECEPTION_ONLY: 'reception_only',
  MULTI_DAY: 'multi_day',
  DESTINATION: 'destination',
  COURTHOUSE: 'courthouse',
  UNDECIDED: 'undecided',
};

export const CEREMONY_TYPE_META = {
  [CeremonyType.CEREMONY_AND_RECEPTION]: { label: 'Ceremony and reception' },
  [CeremonyType.CEREMONY_ONLY]: { label: 'Ceremony only' },
  [CeremonyType.RECEPTION_ONLY]: { label: 'Reception only' },
  [CeremonyType.MULTI_DAY]: { label: 'Multi-day celebration' },
  [CeremonyType.DESTINATION]: { label: 'Destination wedding' },
  [CeremonyType.COURTHOUSE]: { label: 'Courthouse or registry' },
  [CeremonyType.UNDECIDED]: { label: 'Still deciding' },
};

// --- Planning ----------------------------------------------------------------
export const TaskStatus = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  SNOOZED: 'snoozed',
  SKIPPED: 'skipped',
};

export const TASK_STATUS_META = {
  [TaskStatus.TODO]: { label: 'To do', tone: 'neutral' },
  [TaskStatus.IN_PROGRESS]: { label: 'In progress', tone: 'info' },
  [TaskStatus.DONE]: { label: 'Done', tone: 'success' },
  [TaskStatus.SNOOZED]: { label: 'Snoozed', tone: 'warning' },
  [TaskStatus.SKIPPED]: { label: 'Skipped', tone: 'neutral' },
};

export const TaskPriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
};

export const TASK_PRIORITY_META = {
  [TaskPriority.LOW]: { label: 'Low', tone: 'neutral' },
  [TaskPriority.NORMAL]: { label: 'Normal', tone: 'neutral' },
  [TaskPriority.HIGH]: { label: 'High', tone: 'warning' },
};

/** Who owns a task. Kept as an enum rather than a user ID so it works before
 *  the partner has actually joined the workspace. */
export const Assignee = {
  ME: 'me',
  PARTNER: 'partner',
  BOTH: 'both',
  SOMEONE_ELSE: 'someone_else',
  UNASSIGNED: 'unassigned',
};

export const ASSIGNEE_META = {
  [Assignee.ME]: { label: 'Me' },
  [Assignee.PARTNER]: { label: 'Partner' },
  [Assignee.BOTH]: { label: 'Both of us' },
  [Assignee.SOMEONE_ELSE]: { label: 'Someone else' },
  [Assignee.UNASSIGNED]: { label: 'Unassigned' },
};

// --- Budget ------------------------------------------------------------------
export const PaymentStatus = {
  UNPAID: 'unpaid',
  DEPOSIT_PAID: 'deposit_paid',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  REFUNDED: 'refunded',
};

export const PAYMENT_STATUS_META = {
  [PaymentStatus.UNPAID]: { label: 'Unpaid', tone: 'neutral' },
  [PaymentStatus.DEPOSIT_PAID]: { label: 'Deposit paid', tone: 'info' },
  [PaymentStatus.PARTIALLY_PAID]: { label: 'Part paid', tone: 'info' },
  [PaymentStatus.PAID]: { label: 'Paid', tone: 'success' },
  [PaymentStatus.REFUNDED]: { label: 'Refunded', tone: 'warning' },
};

/** An expense is "committed" once it is contractually owed, whether paid or not.
 *  This is what lets the budget show spent vs committed vs remaining. */
export const ExpenseCommitment = {
  ESTIMATED: 'estimated',
  COMMITTED: 'committed',
};

// --- Guests ------------------------------------------------------------------
export const RsvpStatus = {
  PENDING: 'pending',
  ATTENDING: 'attending',
  DECLINED: 'declined',
  MAYBE: 'maybe',
  NO_RESPONSE: 'no_response',
};

export const RSVP_STATUS_META = {
  [RsvpStatus.PENDING]: { label: 'Awaiting reply', tone: 'warning', countsAsAttending: false },
  [RsvpStatus.ATTENDING]: { label: 'Attending', tone: 'success', countsAsAttending: true },
  [RsvpStatus.DECLINED]: { label: 'Declined', tone: 'danger', countsAsAttending: false },
  [RsvpStatus.MAYBE]: { label: 'Maybe', tone: 'info', countsAsAttending: false },
  [RsvpStatus.NO_RESPONSE]: { label: 'No response', tone: 'neutral', countsAsAttending: false },
};

export const InvitationStatus = {
  NOT_SENT: 'not_sent',
  SAVE_THE_DATE_SENT: 'save_the_date_sent',
  INVITED: 'invited',
  REMINDED: 'reminded',
};

export const INVITATION_STATUS_META = {
  [InvitationStatus.NOT_SENT]: { label: 'Not invited', tone: 'neutral' },
  [InvitationStatus.SAVE_THE_DATE_SENT]: { label: 'Save the date sent', tone: 'info' },
  [InvitationStatus.INVITED]: { label: 'Invited', tone: 'brand' },
  [InvitationStatus.REMINDED]: { label: 'Reminder sent', tone: 'warning' },
};

export const PlusOneStatus = {
  NOT_ALLOWED: 'not_allowed',
  ALLOWED: 'allowed',
  CONFIRMED: 'confirmed',
};

export const PLUS_ONE_STATUS_META = {
  [PlusOneStatus.NOT_ALLOWED]: { label: 'No plus one', tone: 'neutral' },
  [PlusOneStatus.ALLOWED]: { label: 'Plus one allowed', tone: 'info' },
  [PlusOneStatus.CONFIRMED]: { label: 'Plus one confirmed', tone: 'success' },
};

export const MealPreference = {
  UNSPECIFIED: 'unspecified',
  STANDARD: 'standard',
  VEGETARIAN: 'vegetarian',
  VEGAN: 'vegan',
  JAIN: 'jain',
  HALAL: 'halal',
  KOSHER: 'kosher',
  GLUTEN_FREE: 'gluten_free',
  CHILD: 'child',
  OTHER: 'other',
};

export const MEAL_PREFERENCE_META = {
  [MealPreference.UNSPECIFIED]: { label: 'Not specified' },
  [MealPreference.STANDARD]: { label: 'Standard' },
  [MealPreference.VEGETARIAN]: { label: 'Vegetarian' },
  [MealPreference.VEGAN]: { label: 'Vegan' },
  [MealPreference.JAIN]: { label: 'Jain' },
  [MealPreference.HALAL]: { label: 'Halal' },
  [MealPreference.KOSHER]: { label: 'Kosher' },
  [MealPreference.GLUTEN_FREE]: { label: 'Gluten free' },
  [MealPreference.CHILD]: { label: "Children's meal" },
  [MealPreference.OTHER]: { label: 'Other' },
};

// --- Vendors -----------------------------------------------------------------
export const VendorStatus = {
  SAVED: 'saved',
  CONTACTED: 'contacted',
  QUOTED: 'quoted',
  MEETING_SCHEDULED: 'meeting_scheduled',
  BOOKED: 'booked',
  DECLINED: 'declined',
  PASSED: 'passed',
};

export const VENDOR_STATUS_META = {
  [VendorStatus.SAVED]: { label: 'Saved', tone: 'neutral' },
  [VendorStatus.CONTACTED]: { label: 'Contacted', tone: 'info' },
  [VendorStatus.QUOTED]: { label: 'Quote received', tone: 'info' },
  [VendorStatus.MEETING_SCHEDULED]: { label: 'Meeting booked', tone: 'brand' },
  [VendorStatus.BOOKED]: { label: 'Booked', tone: 'success' },
  [VendorStatus.DECLINED]: { label: 'They declined', tone: 'danger' },
  [VendorStatus.PASSED]: { label: 'We passed', tone: 'neutral' },
};

// --- AI ----------------------------------------------------------------------
export const MessageRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
};

export const MessageStatus = {
  PENDING: 'pending',
  STREAMING: 'streaming',
  COMPLETE: 'complete',
  FAILED: 'failed',
  BLOCKED_BY_PAYWALL: 'blocked_by_paywall',
};

/** The kinds of change the AI may propose. Each maps to a confirmation preview. */
export const SuggestionType = {
  CREATE_TASKS: 'create_tasks',
  UPDATE_BUDGET: 'update_budget',
  ADD_EXPENSE: 'add_expense',
  UPDATE_GUEST: 'update_guest',
  ADD_GUESTS: 'add_guests',
  SAVE_VENDOR: 'save_vendor',
  DRAFT_MESSAGE: 'draft_message',
};

export const SuggestionStatus = {
  PROPOSED: 'proposed',
  EDITED: 'edited',
  CONFIRMED: 'confirmed',
  DISCARDED: 'discarded',
};

// --- Subscription ------------------------------------------------------------
export const EntitlementStatus = {
  FREE: 'free',
  TRIAL: 'trial',
  ACTIVE: 'active',
  GRACE_PERIOD: 'grace_period',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
};

export const ENTITLEMENT_STATUS_META = {
  [EntitlementStatus.FREE]: { label: 'Free', isPremium: false },
  [EntitlementStatus.TRIAL]: { label: 'Trial', isPremium: true },
  [EntitlementStatus.ACTIVE]: { label: 'Premium', isPremium: true },
  [EntitlementStatus.GRACE_PERIOD]: { label: 'Payment issue', isPremium: true },
  [EntitlementStatus.EXPIRED]: { label: 'Expired', isPremium: false },
  [EntitlementStatus.CANCELLED]: { label: 'Cancelled', isPremium: false },
};

export const SubscriptionPlan = {
  MONTHLY: 'monthly',
  ANNUAL: 'annual',
};

// --- Shared ------------------------------------------------------------------
/** Per-record sync state, so the local-first store is ready for a backend. */
export const SyncStatus = {
  LOCAL_ONLY: 'local_only',
  PENDING_SYNC: 'pending_sync',
  SYNCED: 'synced',
  CONFLICT: 'conflict',
};

/** Helper: is this a valid member of an enum object? */
export function isValidEnumValue(enumObject, value) {
  return Object.values(enumObject).includes(value);
}
