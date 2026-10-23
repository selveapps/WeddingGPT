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
    key: 'style',
    title: 'Style studio',
    blurb: 'A five-question style quiz, palette picks and a shareable moodboard.',
    icon: 'vision',
    route: '/labs/style',
  },
  {
    key: 'sync',
    title: 'Partner sync',
    blurb: 'Share your plan with your partner and merge theirs - latest edit wins.',
    icon: 'refresh',
    route: '/labs/sync',
  },
  {
    key: 'gifts',
    title: 'Gifts and thank-yous',
    blurb: 'Log gifts, see when each thank-you is due, and draft the note.',
    icon: 'heart',
    route: '/labs/gifts',
  },
  {
    key: 'timeline',
    title: 'Day-of timeline',
    blurb: 'A minute-by-minute run of show with overlap checks and a running-late button.',
    icon: 'clock',
    route: '/labs/timeline',
  },
  {
    key: 'party',
    title: 'Wedding party',
    blurb: 'Roles, starter jobs, outfits and a list to send each person.',
    icon: 'star',
    route: '/labs/party',
  },
  {
    key: 'packing',
    title: 'Packing lists',
    blurb: 'Emergency kit, getting-ready bag, venue box and honeymoon checklists.',
    icon: 'checklist',
    route: '/labs/packing',
  },
  {
    key: 'actions',
    title: 'Assistant actions',
    blurb: 'Say "add a $2,000 florist expense" and confirm the change before it happens.',
    icon: 'sparkle',
    route: '/labs/actions',
  },
  {
    key: 'quotes',
    title: 'Quote reader',
    blurb: 'Paste a vendor quote to pull out totals, deposits, due dates and fine print.',
    icon: 'note',
    route: '/labs/quotes',
  },
  {
    key: 'subscriptions',
    title: 'Plus subscription',
    blurb: 'Paywall, plans, a 7-day trial and feature gating - in test mode.',
    icon: 'lock',
    route: '/labs/subscriptions',
  },
  {
    key: 'backup',
    title: 'Export and backup',
    blurb: 'Guest and budget spreadsheets, a plan summary, and a checked full backup.',
    icon: 'lock',
    route: '/labs/backup',
  },
];
