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
  budgetOptionsFor,
  STRESSOR_OPTIONS,
  DATE_TYPE_OPTIONS,
  SEASON_OPTIONS,
  clampStepIndex,
  stepAt,
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
  localSearchQuery,
  recommendLocalPicks,
  PaymentId,
  paymentsFromMilestones,
  milestonesFromPayments,
  paymentTotals,
  derivePaymentStatus,
  upcomingVendorPayments,
  vendorToExpenseDraft,
  vendorFieldsFromLab,
} from './vendors';
export {
  DAILY_CHECKLIST_SIZE,
  pickDailyTasks,
  planDailyChecklists,
  summariseDailyTasks,
} from './daily';
export {
  DEPENDENCY_LIMITS,
  TEMPLATE_DEPENDENCIES,
  prerequisitesOf,
  openPrerequisites,
  isTaskWaiting,
  dependentsOf,
  dependencyError,
  pruneDependencies,
  linkTemplateDependencies,
} from './dependencies';
export {
  VENUE_STYLES,
  findMetro,
  recommendVenues,
  venueSearchQuery,
  venueStyleQuery,
} from './venues';

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
export { buildWeddingContext, contextChips } from './aiContext';
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
export {
  WebsiteSection,
  WEBSITE_LIMITS,
  createWebsite,
  createWebsiteItem,
  websiteUrlError,
  validateWebsiteItem,
  websiteFilledSections,
} from './website';
export {
  DEFAULT_TABLE_CAPACITY,
  MAX_TABLE_CAPACITY,
  createSeatingTable,
  createSeatingRules,
  withKnownGuests,
  seatableGuests,
  freeSeats,
  assignGuest,
  unassignGuest,
  unseatedGuests,
  findConflicts,
  autoSeat,
  seatingSummary,
  guestLabel,
} from './seating';
export {
  ALLERGENS,
  detectAllergens,
  buildCateringReport,
  cateringReportText,
  cateringCsv,
} from './catering';
export {
  ThankYouStatus,
  THANK_YOU_META,
  GiftKind,
  GIFT_KIND_OPTIONS,
  GIFT_LIMITS,
  createGift,
  validateGift,
  nextThankYouStatus,
  thankYouDue,
  summariseGifts,
  sortGifts,
  matchGuest,
  draftThankYou,
  dueLabel,
  giftsCsv,
} from './gifts';
export {
  PARTY_ROLES,
  ROLE_TODOS,
  PARTY_LIMITS,
  createPartyMember,
  memberFromGuest,
  validatePartyMember,
  createPartyTodo,
  roleLabel,
  starterTodos,
  memberProgress,
  partySummary,
  sortMembers,
  memberBrief,
} from './weddingParty';
export {
  RUN_OF_SHOW_LIMITS,
  SAMPLE_DAY,
  createRunOfShowItem,
  validateRunOfShowItem,
  itemsForDay,
  itemEnd,
  sortRunOfShow,
  findOverlaps,
  shiftFrom,
  runOfShowText,
} from './runOfShow';
export {
  PACKING_LISTS,
  PACKING_LIMITS,
  listByKey,
  templateItems,
  templateItemId,
  createPackingItem,
  templatePackingItems,
  itemsFor,
  listProgress,
  missingTemplateItems,
  packingSummary,
  sortForDisplay,
  packingText,
} from './packing';
export {
  EventKind,
  EVENT_KIND_META,
  GuestScope,
  EVENT_LIMITS,
  createWeddingEvent,
  eventName,
  sortEvents,
  eventGuests,
  eventGuestSummary,
  clockFromInput,
  validateEvent,
  eventWhen,
  eventsToWebsiteSchedule,
  mergeWebsiteSchedule,
} from './events';
export {
  EVENT_CHECKLISTS,
  eventChecklist,
  eventChecklistFor,
  templateKeyFor,
  checklistDueDate,
  buildEventTasks,
} from './eventTemplates';
