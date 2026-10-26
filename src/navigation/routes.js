/**
 * Centralised route table.
 *
 * PRD s.19 asks for centralised navigation. With file-based routing the files
 * *are* the routes, so the thing worth centralising is the path strings:
 * screens navigate via `Routes.taskDetail(id)` rather than by typing a template
 * literal, which means renaming a folder is one edit here instead of a grep
 * across the app.
 */
export const Routes = {
  launch: '/',
  designSystem: '/design-system',

  // --- Onboarding ---------------------------------------------------------
  onboarding: '/onboarding',
  plan: '/onboarding/plan',

  // --- Tabs ---------------------------------------------------------------
  // Home is `/home` rather than `/`, because `/` is the launch gate. Route
  // groups are transparent in the URL, so a `(tabs)/index` would collide with
  // `app/index`.
  home: '/(tabs)/home',
  planning: '/(tabs)/planning',
  guests: '/(tabs)/guests',
  budget: '/(tabs)/budget',
  ai: '/(tabs)/ai',

  // --- Assistant ----------------------------------------------------------
  /** `prompt` is sent as the first message when the chat opens. */
  assistantNew: (prompt) =>
    prompt ? `/assistant/new?prompt=${encodeURIComponent(prompt)}` : '/assistant/new',
  assistantChat: (id) => `/assistant/${id}`,

  // --- Home details -------------------------------------------------------
  countdown: '/(tabs)/home',
  progress: '/(tabs)/planning',
  extendedFeatures: '/extended-features',
  /** Vendor recommendations near the wedding city. */
  local: '/local',

  // --- Notifications ------------------------------------------------------
  /** The in-app feed of what is coming up. Settings live at `notifications`. */
  inbox: '/inbox',

  // --- Planning -----------------------------------------------------------
  taskDetail: (id) => `/planning/task/${id}`,
  taskEdit: (id) => `/planning/task/${id}`,
  taskAdd: '/planning/task/new',
  taskCategory: () => '/(tabs)/planning',
  /** The wedding's events: mehndi, ceremony, reception... */
  events: '/events',
  eventAdd: '/events',
  eventDetail: () => '/events',
  /** The suggested checklist for one event (slice C3). */
  eventChecklist: () => '/events',
  packing: '/packing',
  /** The style quiz and palette (graduated from the Labs style studio). */
  style: '/style',
  /** The run of show for the wedding day, or for one event. */
  runOfShow: (eventId) => (eventId ? `/run-of-show?event=${eventId}` : '/run-of-show'),

  // --- Budget -------------------------------------------------------------
  budgetCategory: () => '/(tabs)/budget',
  expenseAdd: '/(tabs)/budget',
  expenseDetail: () => '/(tabs)/budget',
  budgetSetup: '/(tabs)/budget',
  /** Planned against actual, by category and event, and payments due (slice C4). */
  budgetReport: '/(tabs)/budget',

  // --- Guests -------------------------------------------------------------
  guestDetail: () => '/(tabs)/guests',
  guestAdd: '/(tabs)/guests',
  /** Pick guests from the phone's address book. */
  guestImport: '/(tabs)/guests',
  guestSpreadsheet: '/(tabs)/guests',
  guestRsvp: '/rsvp',
  guestWebsite: '/website',
  guestSeating: '/seating',
  guestMeals: '/(tabs)/guests',
  guestGifts: '/gifts',
  guestParty: '/party',
  householdDetail: () => '/(tabs)/guests',

  // --- Vendors ------------------------------------------------------------
  vendors: '/vendors',
  vendorAdd: '/vendors',
  vendorDetail: () => '/vendors',
  vendorEdit: () => '/vendors',
  /** Read a pasted quote; with a vendor id, save it as that vendor's quote. */
  quoteReader: '/vendors',
  vendorCompare: '/vendors',

  // --- Vision -------------------------------------------------------------
  vision: '/labs',
  styleQuiz: '/labs',
  moodboard: '/labs',
  inspirationDetail: '/labs',

  // --- Monetisation and account -------------------------------------------
  paywall: '/account',
  account: '/account',
  signIn: '/account/sign-in',
  invite: (token) => `/invite/${token}`,
  weddingDetails: '/account',
  notifications: '/account/notifications',
  profile: '/profile',
  subscription: '/labs/subscriptions',
  privacy: '/account/settings/privacy',

  // --- Settings -----------------------------------------------------------
  settings: '/account/settings',
  settingsAppearance: '/account/settings/appearance',
  settingsNotifications: '/account/settings/notifications',
  settingsPrivacy: '/account/settings/privacy',
  settingsAccessibility: '/account/settings/accessibility',
  settingsLanguage: '/account/settings/language',
  settingsAI: '/account/settings/ai',
  settingsData: '/account/settings/data',
  settingsWeddingDefaults: '/account/settings/wedding-defaults',
  settingsAbout: '/account/settings/about',
};

/** The five primary destinations, in bottom-bar order (PRD s.5). Assistant leads. */
export const TAB_ITEMS = [
  { name: 'ai', label: 'Assistant', icon: 'sparkle', route: Routes.ai },
  { name: 'home', label: 'Home', icon: 'home', route: Routes.home },
  { name: 'planning', label: 'Planning', icon: 'checklist', route: Routes.planning },
  { name: 'guests', label: 'Guests', icon: 'guests', route: Routes.guests },
  { name: 'budget', label: 'Budget', icon: 'budget', route: Routes.budget },
];
