import { bullets } from '../helpers';

/**
 * Customer-support answers about the app itself.
 *
 * These must stay true to what the app actually does today - an assistant that
 * confidently describes a button that does not exist is worse than none. When
 * a feature is not built yet (password reset, partner sharing, export), the
 * answer says so plainly and offers what is possible now.
 */

export const supportIntents = [
  {
    id: 'support_add_guest',
    priority: 2,
    patterns: [/how (do|can|to) (i|we)? ?(add|invite|import|enter|put).*(guest|people|family|friend)/, /add (a )?guests?/],
    answer: () => ({
      content: `To add guests:\n\n${bullets([
        'Open the **Guests** tab and tap **Add guest**.',
        'Enter their name - contact details, meal choice and plus-one are optional and can be added later.',
        'Put couples and families in the same **household** so their invitation and RSVP stay together.',
        'To update several guests at once, long-press to select them and use the bulk actions.',
      ])}\n\nRSVP counts on Home update the moment you change anyone's status.`,
    }),
  },
  {
    id: 'support_add_task',
    priority: 2,
    patterns: [/how (do|can|to) (i|we)? ?(add|create|make|edit|delete|snooze|complete).*(task|to.?do|checklist item)/],
    answer: () => ({
      content: `Working with tasks:\n\n${bullets([
        '**Add:** Planning tab -> the **+** button. Give it a title, a category and (ideally) a due date.',
        '**Complete:** tap the circle next to a task. You get an **Undo** for a few seconds in case of a mis-tap.',
        '**Edit, snooze or reassign:** open the task and use the actions at the bottom.',
        '**Delete:** open the task -> Delete. You will be asked to confirm.',
      ])}\n\nOr just ask me to **make a checklist** for something and review what I suggest.`,
    }),
  },
  {
    id: 'support_expense',
    priority: 2,
    patterns: [/how (do|can|to) (i|we)? ?(add|log|record|track|enter|edit|change).*(expense|payment|cost|deposit|budget)/, /(change|edit|update|set) (my|our|the) (total )?budget/],
    answer: () => ({
      content: `In the **Budget** tab:\n\n${bullets([
        '**Set or change your total:** tap your total budget at the top (or **Set a budget** if it is empty).',
        '**Add an expense:** tap **Add expense**, pick a category, and mark it as an estimate, committed, or paid.',
        '**Record a payment:** open the expense and log what you have paid - the remaining balance updates automatically.',
        '**Change category amounts:** open a category to adjust its allocation.',
      ])}\n\n"Committed" means booked but not yet paid - it counts against your budget so you never double-spend.`,
    }),
  },
  {
    id: 'support_wedding_details',
    priority: 2,
    patterns: [/(change|edit|update|move|set) (my|our|the) (wedding )?(date|location|city|venue name|partner|names?|details)/, /(date|location) (has )?changed/],
    answer: () => ({
      content: `Editing wedding details from a dedicated settings screen is coming with the Account section.\n\nFor now, if your **date** has changed, the most reliable route is to update the due dates of the affected tasks from the **Planning** tab. If a lot has changed, tell me what moved and I can suggest a fresh checklist dated from the new day.`,
    }),
  },
  {
    id: 'support_sign_out',
    priority: 2,
    patterns: [/(sign|log) ?(out|off)/, /switch account/],
    answer: () => ({
      content: 'Tap your **initials in the top corner of Home**, then **Sign out**. Your plan, budget and guest list stay saved on this device - sign back in any time to pick up where you left off.',
    }),
  },
  {
    id: 'support_password',
    priority: 2,
    patterns: [/(forgot|forgotten|reset|change|lost|recover).*(password|login|account)/, /cant (log|sign) ?in/, /password/],
    answer: () => ({
      content: `Right now accounts are stored securely **on this device only**, so there is no email reset yet - that arrives with online accounts.\n\n${bullets([
        'Check the password with the **eye icon** on the sign-in screen - most failures are a typo.',
        'Your ID is not case-sensitive, but your password is.',
        'If you used a username rather than an email, sign in with exactly that username.',
      ])}\n\nIf you still cannot get in, you can create a new account on this device; your wedding workspace on this phone is kept.`,
    }),
  },
  {
    id: 'support_privacy',
    priority: 2,
    patterns: [/(is|are) (my|our) (data|information|details) (safe|secure|private|stored|shared)/, /(privacy|where is my data|who can see|data stored|sell (my|our) data)/],
    answer: () => ({
      content: `Your wedding workspace is stored **on your device**. Passwords are never stored in plain text - only a salted, scrambled version.\n\n${bullets([
        'Guest names, phone numbers and notes stay in the app on your phone.',
        'When you chat with me, I see a **short summary** - counts and totals like "86 guests, 40 attending" - never your guests\' names or contact details.',
        'Signing out does not delete anything from the device.',
      ])}`,
    }),
  },
  {
    id: 'support_delete',
    priority: 2,
    patterns: [/(delete|remove|erase|wipe).*(account|data|everything|all my)/, /start over|start again|reset (the )?app/],
    answer: () => ({
      content: 'A **Delete account** option is part of the upcoming Account section, and it will always ask you to confirm before anything is erased.\n\nUntil then, uninstalling the app removes all its data from this device. If you only want a fresh plan, you do not need to delete anything - ask me for a new checklist instead.',
    }),
  },
  {
    id: 'support_export',
    priority: 2,
    patterns: [/(export|download|backup|back up|print|share) (my|our|the)? ?(data|guest list|budget|plan|spreadsheet)/],
    answer: () => ({
      content: 'Exporting your guest list, budget and plan is on the way with the Account section. For now, your data is saved safely on this device and survives closing the app.',
    }),
  },
  {
    id: 'support_partner',
    priority: 2,
    patterns: [/(share|invite|add).*(partner|fianc|spouse|husband|wife)/, /(partner|fianc).*(access|login|join|collaborat)/, /plan together/],
    answer: () => ({
      content: 'Tap **Invite your partner** on Home to send them an invite by text, WhatsApp or email - it also adds their name to your dashboard. Shared editing from two phones arrives with online accounts; until then, you can assign tasks to **your partner** or to **both of you** from any task screen, so it is always clear who owns what.',
    }),
  },
  {
    id: 'support_pricing',
    priority: 2,
    patterns: [/(pricing|cost of the app|subscription|premium|is (it|this|the)( app)? free|upgrade|refund my (subscription|purchase))/, /(how much|what) (does|is) (the|this) app (cost)?/],
    keywords: { free: 1, subscription: 2 },
    answer: () => ({
      content: 'WeddingGPT is free to use right now - planning, budget, guests and this assistant included. Premium plans with extras like partner collaboration are planned; when they arrive, everything you have already built stays yours on the free tier.',
    }),
  },
  {
    id: 'support_notifications',
    priority: 2,
    patterns: [/(notification|reminder|remind me|alert)s?( settings)?/],
    keywords: { notification: 2 },
    answer: () => ({
      content: 'Reminders for upcoming and overdue tasks are coming with notification settings. Meanwhile, **Home** always shows your next best step and anything due in the next 30 days - a quick look each morning keeps you on track.',
    }),
  },
  {
    id: 'support_bug',
    priority: 2,
    patterns: [/(not working|doesnt work|broken|bug|crash|error|stuck|frozen|wont (load|open|save))/, /(app|screen) is (slow|blank)/],
    answer: () => ({
      content: `Sorry about that. A few things that fix most problems:\n\n${bullets([
        'Fully close the app and reopen it - your data is saved and will reload.',
        'Check you are on the latest version from the app store.',
        'If a screen will not load, pull down to refresh where available.',
      ])}\n\nIf it keeps happening, tell me what you tapped and what you expected to see, and I will help you work around it.`,
    }),
  },
  {
    id: 'support_contact',
    priority: 1,
    patterns: [/(contact|speak to|talk to).*(support|human|person|team|someone|agent)/, /customer (service|support|care)/],
    answer: () => ({
      content: 'I can help with most questions right here - about the app, your plan, or wedding planning in general. Tell me what is going on and I will do my best.\n\nA direct line to the WeddingGPT team is coming with the Account section; if something is blocking you, describe it and I will help you find a way around it now.',
    }),
  },
];
