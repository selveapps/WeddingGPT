/**
 * The complete analytics event vocabulary (PRD s.26).
 *
 * Screens never pass a raw string to `track()` - they pass one of these
 * constants, so the event taxonomy stays auditable and a rename is a single
 * edit rather than a grep-and-pray.
 */
export const AnalyticsEvents = {
  // --- Lifecycle -----------------------------------------------------------
  APP_OPENED: 'app_opened',
  SCREEN_VIEWED: 'screen_viewed',

  // --- Launch --------------------------------------------------------------
  INTRO_SKIPPED: 'intro_skipped',
  LAUNCH_FAILED: 'launch_failed',

  // --- Onboarding ----------------------------------------------------------
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_STEP_SKIPPED: 'onboarding_step_skipped',
  ONBOARDING_RESUMED: 'onboarding_resumed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_EXITED_EARLY: 'onboarding_exited_early',
  PLAN_GENERATED: 'plan_generated',

  // --- Wedding -------------------------------------------------------------
  WEDDING_CREATED: 'wedding_created',
  WEDDING_UPDATED: 'wedding_updated',

  // --- Planning ------------------------------------------------------------
  TASK_CREATED: 'task_created',
  TASK_COMPLETED: 'task_completed',
  TASK_REOPENED: 'task_reopened',
  TASK_EDITED: 'task_edited',
  TASK_DELETED: 'task_deleted',
  TASK_SNOOZED: 'task_snoozed',
  TASK_REASSIGNED: 'task_reassigned',
  TASKS_FILTERED: 'tasks_filtered',

  // --- Budget --------------------------------------------------------------
  BUDGET_CREATED: 'budget_created',
  BUDGET_UPDATED: 'budget_updated',
  BUDGET_CATEGORY_ADDED: 'budget_category_added',
  EXPENSE_ADDED: 'expense_added',
  EXPENSE_UPDATED: 'expense_updated',
  EXPENSE_DELETED: 'expense_deleted',
  OVER_BUDGET_WARNING_SHOWN: 'over_budget_warning_shown',

  // --- Guests --------------------------------------------------------------
  GUEST_ADDED: 'guest_added',
  GUEST_UPDATED: 'guest_updated',
  GUEST_DELETED: 'guest_deleted',
  GUESTS_IMPORTED: 'guests_imported',
  RSVP_UPDATED: 'rsvp_updated',
  HOUSEHOLD_CREATED: 'household_created',

  // --- Vendors -------------------------------------------------------------
  VENDOR_SAVED: 'vendor_saved',
  VENDOR_STATUS_CHANGED: 'vendor_status_changed',
  VENDOR_BOOKED: 'vendor_booked',
  LOCAL_SEARCH_OPENED: 'local_search_opened',
  VENUE_SEARCH_OPENED: 'venue_search_opened',
  DAILY_CHECKLIST_COMPLETED: 'daily_checklist_completed',
  QUOTE_ADDED: 'quote_added',

  // --- Vision --------------------------------------------------------------
  STYLE_QUIZ_STARTED: 'style_quiz_started',
  STYLE_QUIZ_COMPLETED: 'style_quiz_completed',
  INSPIRATION_SAVED: 'inspiration_saved',
  INSPIRATION_REMOVED: 'inspiration_removed',

  // --- AI ------------------------------------------------------------------
  AI_CONVERSATION_STARTED: 'ai_conversation_started',
  AI_MESSAGE_SENT: 'ai_message_sent',
  AI_RESPONSE_GENERATED: 'ai_response_generated',
  AI_RESPONSE_FAILED: 'ai_response_failed',
  AI_RESPONSE_RETRIED: 'ai_response_retried',
  AI_SUGGESTION_CONFIRMED: 'ai_suggestion_confirmed',
  AI_SUGGESTION_DISCARDED: 'ai_suggestion_discarded',
  AI_SUGGESTION_EDITED: 'ai_suggestion_edited',

  // --- Monetisation --------------------------------------------------------
  PAYWALL_VIEWED: 'paywall_viewed',
  PAYWALL_DISMISSED: 'paywall_dismissed',
  PURCHASE_STARTED: 'purchase_started',
  PURCHASE_COMPLETED: 'purchase_completed',
  PURCHASE_FAILED: 'purchase_failed',
  SUBSCRIPTION_RESTORED: 'subscription_restored',
  ENTITLEMENT_EXPIRED: 'entitlement_expired',

  // --- Account -------------------------------------------------------------
  ACCOUNT_DATA_EXPORTED: 'account_data_exported',
  ACCOUNT_DELETED: 'account_deleted',
  PARTNER_INVITED: 'partner_invited',
  NOTIFICATION_PREFERENCE_CHANGED: 'notification_preference_changed',
};

export const AnalyticsEventNames = Object.values(AnalyticsEvents);
