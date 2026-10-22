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
    key: 'vendors',
    title: 'Vendor manager',
    blurb: 'Track each vendor from saved to booked, with deposits and balances.',
    icon: 'vendors',
    route: '/labs/vendors',
  },
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
    key: 'seating',
    title: 'Seating chart',
    blurb: 'Tables, auto-seating that keeps households together, and keep-apart pairs.',
    icon: 'guests',
    route: '/labs/seating',
  },
  {
    key: 'meals',
    title: 'Meals and dietary',
    blurb: 'Caterer numbers, allergy flags and a CSV export from your guest list.',
    icon: 'note',
    route: '/labs/meals',
  },
  {
    key: 'rsvp',
    title: 'RSVP codes',
    blurb: 'A short code per household, shareable invites, and paste-in replies.',
    icon: 'mail',
    route: '/labs/rsvp',
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
];
