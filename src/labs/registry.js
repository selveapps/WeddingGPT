/**
 * Every Labs prototype, in the order the Labs hub lists them.
 *
 * Labs live outside the finished app: nothing in the tabs links here. Open
 * the hub at `/labs` (on a phone, `weddinggpt://labs`) to try them. A feature
 * graduates by moving its folder out of `src/labs` and wiring its screen into
 * a real route.
 */
export const LAB_FEATURES = [
  {
    key: 'subscriptions',
    title: 'Plus subscription',
    blurb: 'Paywall, plans, a 7-day trial and feature gating - in test mode.',
    icon: 'lock',
    route: '/labs/subscriptions',
  },
];
