/**
 * The typed model layer.
 *
 * Everything the app persists is created through a factory here, so no entity
 * can exist without an ID and timestamps, and no status can be an ad-hoc
 * string. Stores import from this barrel; screens usually only need the enums
 * and the `*_META` maps for labels and badge tones.
 */

// --- Enums and their display metadata --------------------------------------
export * from './enums';

// --- Entity scaffolding and collection helpers -----------------------------
export {
  createEntity,
  touchEntity,
  normalise,
  denormalise,
  deriveFromCollection,
  emptyCollection,
  upsert,
  upsertMany,
  removeById,
  removeManyById,
} from './base';

// --- Wedding root ----------------------------------------------------------
export {
  createUser,
  createCouple,
  createWedding,
  createWeddingDate,
  createWeddingLocation,
  coupleDisplayName,
  hasExactDate,
} from './wedding';

// --- Planning --------------------------------------------------------------
export {
  DEFAULT_TASK_CATEGORIES,
  createTask,
  createTaskCategory,
  isTaskOverdue,
  isTaskOpen,
  isSnoozeActive,
  calculateProgress,
  selectNextBestAction,
  selectUpcomingDeadlines,
} from './planning';

// --- Plan generation -------------------------------------------------------
export {
  CHECKLIST_TEMPLATE,
  planningHorizonMonths,
  generatePersonalisedPlan,
  firstRecommendedActions,
} from './planGeneration';

// --- Onboarding script -----------------------------------------------------
export {
  StepKind,
  ONBOARDING_STEPS,
  ONBOARDING_STEP_COUNT,
  GUEST_COUNT_OPTIONS,
  BUDGET_OPTIONS,
  STRESSOR_OPTIONS,
  DATE_TYPE_OPTIONS,
  SEASON_OPTIONS,
  clampStepIndex,
  stepAt,
  isStepAnswered,
} from './onboarding';

// --- Budget ----------------------------------------------------------------
export {
  DEFAULT_BUDGET_ALLOCATION,
  createBudget,
  createBudgetCategory,
  createExpense,
  summariseBudget,
  summariseCategory,
  buildDefaultCategories,
} from './budget';

// --- Guests ----------------------------------------------------------------
export {
  createGuest,
  createHousehold,
  guestFullName,
  summariseRsvps,
  summariseMeals,
  countsAsAttending,
  groupByHousehold,
} from './guests';

// --- Vendors ---------------------------------------------------------------
export {
  VENDOR_CATEGORIES,
  VendorSource,
  createVendor,
  createVendorCategory,
  createQuote,
  createVendorNote,
  isVendorBooked,
  summariseVendors,
} from './vendors';

// --- Vision ----------------------------------------------------------------
export {
  WEDDING_STYLES,
  COLOR_PALETTES,
  createStyleProfile,
  createInspirationItem,
  createMoodboard,
  scoreStyleQuiz,
} from './vision';

// --- AI --------------------------------------------------------------------
export {
  createConversation,
  createMessage,
  createSuggestion,
  effectivePayload,
  isSuggestionPending,
  deriveConversationTitle,
} from './ai';

// --- Account ---------------------------------------------------------------
export {
  createEntitlement,
  isPremiumActive,
  NotificationType,
  NOTIFICATION_TYPE_META,
  createNotificationPreferences,
  createUserPreferences,
} from './account';
