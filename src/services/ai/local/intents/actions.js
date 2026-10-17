import { bullets, dueDateFor, dueLabel, firstName, pickTopic } from '../helpers';

/**
 * Intents that produce a *proposal* - a checklist to add, or a message to send.
 *
 * Nothing here touches the workspace. Each answer returns `proposal`, which
 * the store turns into a suggestion card; the couple edits it and confirms
 * before a single task is created (PRD s.13).
 */

/** Task templates by topic. `m` = months before the wedding it is usually done. */
const CHECKLISTS = {
  venue: {
    label: 'booking your venue',
    match: /(venue|hall|location|banquet|lawn)/,
    tasks: [
      { title: 'Agree a venue budget and guest capacity', m: 13, cat: 'venue' },
      { title: 'Shortlist five venues that fit date, size and budget', m: 12, cat: 'venue' },
      { title: 'Visit the top three venues in person', m: 12, cat: 'venue' },
      { title: 'Compare venue quotes line by line', m: 11, cat: 'venue' },
      { title: 'Confirm wet-weather and parking plans with the venue', m: 11, cat: 'venue' },
      { title: 'Sign the venue contract and pay the deposit', m: 11, cat: 'venue' },
    ],
  },
  photo: {
    label: 'finding your photographer',
    match: /(photo|photographer|video)/,
    tasks: [
      { title: 'Save ten photos whose style you love', m: 11, cat: 'vendors' },
      { title: 'Shortlist three photographers and check full galleries', m: 10, cat: 'vendors' },
      { title: 'Video-call your top two photographers', m: 10, cat: 'vendors' },
      { title: 'Book the photographer and pay the deposit', m: 9, cat: 'vendors' },
      { title: 'Share the family portrait list with the photographer', m: 1, cat: 'vendors' },
    ],
  },
  catering: {
    label: 'sorting food and drink',
    match: /(cater|food|menu|bar|drinks|cake)/,
    tasks: [
      { title: 'Shortlist caterers (or confirm the venue in-house option)', m: 10, cat: 'vendors' },
      { title: 'Book a menu tasting', m: 8, cat: 'vendors' },
      { title: 'Finalise the menu and bar package', m: 4, cat: 'vendors' },
      { title: 'Collect dietary requirements from guests', m: 2, cat: 'guests' },
      { title: 'Send the final headcount to the caterer', m: 0.5, cat: 'vendors' },
    ],
  },
  attire: {
    label: 'your wedding outfits',
    match: /(dress|attire|outfit|lehenga|sherwani|suit|saree|sari|wear)/,
    tasks: [
      { title: 'Gather outfit inspiration and set an attire budget', m: 9, cat: 'attire' },
      { title: 'Book appointments at three shops or designers', m: 8, cat: 'attire' },
      { title: 'Order the main wedding outfits', m: 7, cat: 'attire' },
      { title: 'Book hair and makeup, with a trial', m: 5, cat: 'attire' },
      { title: 'Schedule fittings and alterations', m: 2, cat: 'attire' },
      { title: 'Buy shoes and accessories and break the shoes in', m: 1, cat: 'attire' },
    ],
  },
  guests: {
    label: 'the guest list and invitations',
    match: /(guest|invit|rsvp|save the date|stationery)/,
    tasks: [
      { title: 'Draft the full guest list together', m: 10, cat: 'guests' },
      { title: 'Collect every guest address and phone number', m: 8, cat: 'guests' },
      { title: 'Send save-the-dates', m: 7, cat: 'guests' },
      { title: 'Order invitations', m: 4, cat: 'guests' },
      { title: 'Send invitations', m: 2, cat: 'guests' },
      { title: 'Chase outstanding RSVPs', m: 1, cat: 'guests' },
      { title: 'Build the seating plan', m: 0.5, cat: 'guests' },
    ],
  },
  honeymoon: {
    label: 'the honeymoon',
    match: /(honeymoon|trip|travel)/,
    tasks: [
      { title: 'Agree honeymoon budget and dates', m: 8, cat: 'details' },
      { title: 'Check passports and visa requirements', m: 6, cat: 'paperwork' },
      { title: 'Book flights and accommodation', m: 5, cat: 'details' },
      { title: 'Arrange travel insurance', m: 3, cat: 'paperwork' },
      { title: 'Pack for the honeymoon', m: 0.25, cat: 'week_of' },
    ],
  },
  week_of: {
    label: 'the final week',
    match: /(week of|final week|last week|day before|night before|final days)/,
    tasks: [
      { title: 'Confirm arrival times with every vendor', m: 0.25, cat: 'week_of' },
      { title: 'Share the day-of timeline with vendors and the wedding party', m: 0.25, cat: 'week_of' },
      { title: 'Prepare labelled envelopes for final payments and tips', m: 0.2, cat: 'week_of' },
      { title: 'Pack the emergency kit', m: 0.15, cat: 'week_of' },
      { title: 'Hand the rings and documents to a trusted person', m: 0.05, cat: 'week_of' },
    ],
  },
  legal: {
    label: 'the legal paperwork',
    match: /(legal|paperwork|marriage (licen[cs]e|certificate|registration)|register)/,
    tasks: [
      { title: 'Check marriage registration requirements for your location', m: 4, cat: 'paperwork' },
      { title: 'Gather ID, address proof and photographs', m: 3, cat: 'paperwork' },
      { title: 'Book the registration appointment', m: 2, cat: 'paperwork' },
      { title: 'Arrange witnesses', m: 1, cat: 'paperwork' },
    ],
  },
};

const GENERAL_CHECKLIST = {
  label: 'getting started',
  tasks: [
    { title: 'Agree your three wedding priorities as a couple', m: 14, cat: 'foundations' },
    { title: 'Set a total budget', m: 13, cat: 'budget' },
    { title: 'Draft a first guest list', m: 12, cat: 'guests' },
    { title: 'Book the venue', m: 11, cat: 'venue' },
    { title: 'Book the photographer', m: 9, cat: 'vendors' },
    { title: 'Send save-the-dates', m: 7, cat: 'guests' },
  ],
};

function buildTaskProposal(ctx, checklist) {
  const tasks = checklist.tasks.map((task, index) => ({
    title: task.title,
    dueDate: dueDateFor(ctx, task.m, index),
    categoryKey: task.cat,
  }));
  return {
    type: 'create_tasks',
    title: `Checklist: ${checklist.label}`,
    summary: `${tasks.length} tasks, dated from your wedding day`,
    payload: { tasks },
  };
}

// --- Message drafts ----------------------------------------------------------

function signOff(ctx) {
  const { ownerName, partnerName } = ctx.couple ?? {};
  if (ownerName && partnerName) return `${ownerName} & ${partnerName}`;
  return ownerName || '[Your names]';
}

const dateText = (ctx) => ctx.date?.label ?? '[our date]';
const placeText = (ctx) => ctx.location ?? '[our city]';

const DRAFTS = [
  {
    key: 'venue_parking',
    match: /(parking|venue question|ask (the|our) venue)/,
    title: 'Question for your venue',
    body: (ctx) => `Hello,\n\nWe are looking forward to our wedding with you on ${dateText(ctx)}. We are expecting around ${ctx.guests?.headcount || ctx.guests?.estimate || '[number]'} guests and wanted to check a few practical details:\n\n1. How many cars can park on site, and is there overflow parking nearby?\n2. Is valet or a parking attendant available, and at what cost?\n3. Is there a drop-off point close to the entrance for elderly guests?\n\nThank you so much - we would be grateful for a reply when convenient.\n\nWarm regards,\n${signOff(ctx)}`,
  },
  {
    key: 'rsvp_reminder',
    match: /(rsvp|remind|reminder|haven.?t replied|not replied|chase)/,
    title: 'RSVP reminder',
    body: (ctx) => `Hi [Name],\n\nWe hope you are well! We are finalising numbers for our wedding on ${dateText(ctx)} and would love to know if you can join us.\n\nCould you let us know by [RSVP date]? It helps us plan the food and seating.\n\nWe really hope to celebrate with you.\n\nLove,\n${signOff(ctx)}`,
  },
  {
    key: 'thank_you',
    match: /(thank.?you|thanks note|thank (them|guests))/,
    title: 'Thank-you note',
    body: (ctx) => `Dear [Name],\n\nThank you so much for celebrating with us${ctx.date?.label ? ` on ${ctx.date.label}` : ''}, and for the beautiful [gift]. We are already [how you will use it], and we think of you every time.\n\nIt meant so much to have you there - [a moment you shared].\n\nWith love and gratitude,\n${signOff(ctx)}`,
  },
  {
    key: 'save_the_date',
    match: /(save.the.date|announce|announcement)/,
    title: 'Save-the-date',
    body: (ctx) => `Save the date!\n\n${signOff(ctx)} are getting married on ${dateText(ctx)} in ${placeText(ctx)}.\n\nA formal invitation will follow. We cannot wait to celebrate with you.`,
  },
  {
    key: 'vendor_refund',
    match: /(refund|cancel|deposit back)/,
    title: 'Refund request to a vendor',
    body: (ctx) => `Dear [Vendor name],\n\nFollowing our conversation on [date], we understand you are no longer able to provide [service] for our wedding on ${dateText(ctx)}.\n\nCould you please confirm the cancellation in writing, and arrange a refund of our deposit of [amount] as set out in our agreement dated [contract date]?\n\nIf you are able to recommend someone to take your place, we would be very grateful.\n\nKind regards,\n${signOff(ctx)}`,
  },
  {
    key: 'vendor_inquiry',
    match: /(vendor|photographer|caterer|florist|dj|band|decorator|enquiry|inquiry|availability|quote)/,
    title: 'Vendor enquiry',
    body: (ctx) => `Hello [Vendor name],\n\nWe are planning our wedding for ${dateText(ctx)} in ${placeText(ctx)}, with around ${ctx.guests?.estimate || '[number]'} guests, and we love your work.\n\nCould you let us know:\n\n1. Whether you are available on our date\n2. Your packages and what each includes\n3. Your deposit and payment terms\n\nWe would love to set up a short call if you are free this week.\n\nThank you,\n${signOff(ctx)}`,
  },
];

export const actionIntents = [
  {
    id: 'make_checklist',
    priority: 3,
    patterns: [/(make|create|generate|build|give|write|draft|plan).*(checklist|task list|to.?do|tasks|list of (things|tasks|steps))/, /(checklist|to.?do list) for/],
    keywords: { checklist: 3, tasks: 1 },
    answer: (ctx, text, current) => {
      const checklist = pickTopic(Object.values(CHECKLISTS), text, current) ?? GENERAL_CHECKLIST;
      const proposal = buildTaskProposal(ctx, checklist);
      return {
        content: `Here is a checklist for ${checklist.label}, dated back from your wedding day:\n\n${bullets(
          proposal.payload.tasks.map((t) => `${t.title} - ${dueLabel(t.dueDate)}`)
        )}\n\nReview it below - you can rename or remove tasks before anything is added to your plan.`,
        proposal,
      };
    },
  },
  {
    id: 'draft_message',
    priority: 3,
    patterns: [/(draft|write|compose|help me (write|word)|template for|wording for).*(message|email|note|text|letter|card|reminder|invite|enquiry|inquiry)/, /(draft|write) (a|an|the|our)? ?(rsvp|thank|save|refund|vendor|venue)/],
    keywords: { draft: 2, email: 1, message: 1 },
    answer: (ctx, text, current) => {
      const draft = pickTopic(DRAFTS, text, current) ?? DRAFTS.find((d) => d.key === 'vendor_inquiry');
      const body = draft.body(ctx);
      return {
        content: `Here is a draft ${draft.title.toLowerCase()}${firstName(ctx) ? `, ${firstName(ctx)}` : ''}. Fill in anything in [brackets], and edit it however you like before you send it.`,
        proposal: {
          type: 'draft_message',
          title: draft.title,
          summary: 'Edit, then share or copy',
          payload: { body },
        },
      };
    },
  },
];
