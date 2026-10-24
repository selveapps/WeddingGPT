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
  countdown: '/home/countdown',
  progress: '/home/progress',
  /** Vendor recommendations near the wedding city. */
  local: '/home/local',

  // --- Notifications ------------------------------------------------------
  /** The in-app feed of what is coming up. Settings live at `notifications`. */
  inbox: '/inbox',

  // --- Planning -----------------------------------------------------------
  taskDetail: (id) => `/planning/task/${id}`,
  taskEdit: (id) => `/planning/task/${id}/edit`,
  taskAdd: '/planning/task/new',
  taskCategory: (id) => `/planning/category/${id}`,
  /** The wedding's events: mehndi, ceremony, reception... */
  events: '/planning/events',
  eventAdd: '/planning/events/new',
  eventDetail: (id) => `/planning/events/${id}`,
  /** The suggested checklist for one event (slice C3). */
  eventChecklist: (id) => `/planning/events/${id}/checklist`,
  packing: '/planning/packing',
  /** The style quiz and palette (graduated from the Labs style studio). */
  style: '/planning/style',
  /** The run of show for the wedding day, or for one event. */
  runOfShow: (eventId) => (eventId ? `/planning/run-of-show?event=${eventId}` : '/planning/run-of-show'),

  // --- Budget -------------------------------------------------------------
  budgetCategory: (id) => `/budget/category/${id}`,
  expenseAdd: '/budget/expense/new',
  expenseDetail: (id) => `/budget/expense/${id}`,
  budgetSetup: '/budget/setup',
  /** Planned against actual, by category and event, and payments due (slice C4). */
  budgetReport: '/budget/report',

  // --- Guests -------------------------------------------------------------
  guestDetail: (id) => `/guests/${id}`,
  guestAdd: '/guests/new',
  /** Pick guests from the phone's address book. */
  guestImport: '/guests/import',
  guestSpreadsheet: '/guests/spreadsheet',
  guestRsvp: '/guests/rsvp',
  guestWebsite: '/guests/website',
  guestSeating: '/guests/seating',
  guestMeals: '/guests/meals',
  guestGifts: '/guests/gifts',
  guestParty: '/guests/party',
  householdDetail: (id) => `/guests/household/${id}`,

  // --- Vendors ------------------------------------------------------------
  vendors: '/vendors',
  vendorAdd: '/vendors/new',
  vendorDetail: (id) => `/vendors/${id}`,
  vendorEdit: (id) => `/vendors/${id}/edit`,
  /** Read a pasted quote; with a vendor id, save it as that vendor's quote. */
  quoteReader: (vendorId) => (vendorId ? `/vendors/quote?vendor=${vendorId}` : '/vendors/quote'),
  vendorCompare: '/vendors/compare',

  // --- Vision -------------------------------------------------------------
  vision: '/vision',
  styleQuiz: '/vision/quiz',
  moodboard: '/vision/moodboard',
  inspirationDetail: (id) => `/vision/inspiration/${id}`,

  // --- Monetisation and account -------------------------------------------
  paywall: '/paywall',
  account: '/account',
  signIn: '/account/sign-in',
  invite: (token) => `/invite/${token}`,
  weddingDetails: '/account/wedding',
  notifications: '/account/notifications',
  profile: '/account/profile',
  subscription: '/account/subscription',
  privacy: '/account/privacy',
};

/** The five primary destinations, in bottom-bar order (PRD s.5). Assistant leads. */
export const TAB_ITEMS = [
  { name: 'ai', label: 'Assistant', icon: 'sparkle', route: Routes.ai },
  { name: 'home', label: 'Home', icon: 'home', route: Routes.home },
  { name: 'planning', label: 'Planning', icon: 'checklist', route: Routes.planning },
  { name: 'guests', label: 'Guests', icon: 'guests', route: Routes.guests },
  { name: 'budget', label: 'Budget', icon: 'budget', route: Routes.budget },
];
