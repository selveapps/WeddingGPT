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
  onboardingStep: (index) => `/onboarding/${index}`,
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

  // --- Home details -------------------------------------------------------
  countdown: '/home/countdown',
  progress: '/home/progress',

  // --- Planning -----------------------------------------------------------
  taskDetail: (id) => `/planning/task/${id}`,
  taskEdit: (id) => `/planning/task/${id}/edit`,
  taskAdd: '/planning/task/new',
  taskCategory: (id) => `/planning/category/${id}`,

  // --- Budget -------------------------------------------------------------
  budgetCategory: (id) => `/budget/category/${id}`,
  expenseAdd: '/budget/expense/new',
  expenseDetail: (id) => `/budget/expense/${id}`,
  budgetSetup: '/budget/setup',

  // --- Guests -------------------------------------------------------------
  guestDetail: (id) => `/guests/${id}`,
  guestAdd: '/guests/new',
  householdDetail: (id) => `/guests/household/${id}`,

  // --- Vendors ------------------------------------------------------------
  vendors: '/vendors',
  vendorCategory: (key) => `/vendors/category/${key}`,
  vendorDetail: (id) => `/vendors/${id}`,

  // --- Vision -------------------------------------------------------------
  vision: '/vision',
  styleQuiz: '/vision/quiz',
  moodboard: '/vision/moodboard',
  inspirationDetail: (id) => `/vision/inspiration/${id}`,

  // --- Monetisation and account -------------------------------------------
  paywall: '/paywall',
  account: '/account',
  weddingDetails: '/account/wedding',
  notifications: '/account/notifications',
  subscription: '/account/subscription',
  privacy: '/account/privacy',
};

/** The five primary destinations, in bottom-bar order (PRD s.5). */
export const TAB_ITEMS = [
  { name: 'home', label: 'Home', icon: 'home', route: Routes.home },
  { name: 'planning', label: 'Planning', icon: 'checklist', route: Routes.planning },
  { name: 'guests', label: 'Guests', icon: 'guests', route: Routes.guests },
  { name: 'budget', label: 'Budget', icon: 'budget', route: Routes.budget },
  { name: 'ai', label: 'Assistant', icon: 'sparkle', route: Routes.ai },
];
