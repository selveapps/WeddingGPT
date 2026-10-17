import { bullets, monthsLeft, pickTopic } from '../helpers';

/**
 * General wedding knowledge: etiquette, vendor questions, timelines and
 * emergencies. Written as considered advice rather than rules - customs vary
 * by culture and family, and the copy says so where it matters.
 */

const VENDOR_QUESTIONS = {
  photographer: {
    label: 'photographer',
    match: /(photo|photographer|videograph|video)/,
    questions: [
      'Can we see two or three **full galleries** from weddings like ours, not just highlights?',
      'How many hours are included, and what does an extra hour cost?',
      'Will you personally shoot, or an associate? Is a second shooter included?',
      'When do we get the edited photos, and how many should we expect?',
      'Do we get full-resolution files and printing rights?',
      'What is your backup plan if you are ill, or a camera fails?',
      'What is the deposit, the payment schedule and the cancellation policy?',
    ],
  },
  venue: {
    label: 'venue',
    match: /(venue|hall|banquet|lawn|resort|hotel)/,
    questions: [
      'Is our date available, and how long can you hold it?',
      'What is the capacity **seated** and standing, and the minimum guest count or spend?',
      'What is included - tables, chairs, linen, lighting, sound, staff?',
      'Do we have to use your in-house caterer and decorator, or can we bring our own?',
      'What time can vendors get in, and when must everything end? Are there noise limits?',
      'Is there parking, and how many cars fit? Is valet available?',
      'What is the wet-weather plan for any outdoor space?',
      'What are the deposit, payment milestones and cancellation terms?',
    ],
  },
  caterer: {
    label: 'caterer',
    match: /(cater|food|menu|chef|bar|drinks)/,
    questions: [
      'Can we book a **tasting**, and is it free?',
      'What is the price per head, and what exactly does it include - service staff, crockery, taxes?',
      'How do you handle vegetarian, vegan, Jain, gluten-free and allergy requirements?',
      'How many servers will there be for our guest count?',
      'Do you provide the bar, or can we arrange our own? Is there a corkage fee?',
      'When do you need the final headcount?',
      'What happens to leftover food?',
    ],
  },
  florist: {
    label: 'florist or decorator',
    match: /(florist|flower|decor|decorator)/,
    questions: [
      'Which flowers are in season for our date, and which will hold up in the heat?',
      'Can you show a mock-up of one centrepiece before we commit?',
      'What is included - setup, teardown, rentals like vases and arches?',
      'Can ceremony pieces be moved to the reception?',
      'What is the minimum order and the deposit?',
    ],
  },
  music: {
    label: 'DJ or band',
    match: /(dj|band|music|musician|sangeet)/,
    questions: [
      'Can we see a video of you performing at a real wedding?',
      'How much input do we get on the playlist, and can we give a do-not-play list?',
      'What equipment do you bring, and what power and space do you need?',
      'Will you also MC and make announcements?',
      'How long do you play, and what are the breaks? What does overtime cost?',
    ],
  },
  planner: {
    label: 'wedding planner',
    match: /(planner|coordinator)/,
    questions: [
      'Do you offer full planning, partial planning or day-of coordination?',
      'How many weddings do you take on the same weekend?',
      'Do you receive commissions from vendors you recommend?',
      'How involved will you be on the day, and how many assistants will you bring?',
      'How do you charge - a flat fee or a percentage of the budget?',
    ],
  },
  makeup: {
    label: 'hair and makeup artist',
    match: /(makeup|make up|hair|mua|mehendi|mehndi)/,
    questions: [
      'Is a trial included, and when should we book it?',
      'How many people can you get ready, and how long does each take?',
      'Do you travel to us, and is there a travel fee?',
      'Which products do you use - are they long-wear and suitable for sensitive skin?',
    ],
  },
};

const BOOKING_WINDOWS = [
  ['Venue', '10-14 months before'],
  ['Photographer and videographer', '9-12 months before'],
  ['Caterer', '9-12 months before (often tied to the venue)'],
  ['Planner, if you want one', '10-12 months before'],
  ['Band or DJ', '8-10 months before'],
  ['Attire', '6-9 months before - allow time for alterations'],
  ['Florist and decor', '6-8 months before'],
  ['Hair and makeup', '4-6 months before, with a trial 1-2 months out'],
  ['Invitations sent', '6-8 weeks before (10-12 for destination weddings)'],
];

export const knowledgeIntents = [
  // --- Vendors -------------------------------------------------------------
  {
    id: 'vendor_questions',
    priority: 2,
    patterns: [/(what|which) (questions|should (we|i) ask)/, /questions (to|for) (ask|a|the|our)/, /before (we|i) (book|sign|hire)/, /interview.*(vendor|photographer|caterer|dj)/],
    keywords: { ask: 1, questions: 2, vendor: 1 },
    answer: (ctx, text, current) => {
      const match = pickTopic(Object.values(VENDOR_QUESTIONS), text, current);
      if (!match) {
        return {
          content: `Good questions for **any** vendor:\n\n${bullets([
            'Are you available on our date - and can you hold it while we decide?',
            'What exactly is included in the price, and what costs extra?',
            'Can we see recent work or speak to a couple you worked with?',
            'What are the deposit, payment schedule and cancellation terms?',
            'Who will actually be there on the day?',
            'What is your backup plan if something goes wrong?',
          ])}\n\nTell me which vendor - photographer, venue, caterer, florist, DJ, planner or makeup - and I will give you a specific list.`,
        };
      }
      return {
        content: `Questions to ask your ${match.label}:\n\n${bullets(match.questions)}\n\nGet the answers **in writing** in the contract - especially what is included, the timeline and the cancellation terms.`,
      };
    },
  },
  {
    id: 'vendor_compare',
    priority: 1,
    patterns: [/(compare|comparing|choose between|decide between|which is better).*(vendor|quote|photographer|venue|caterer|option)/, /(two|three|multiple) quotes/],
    keywords: { compare: 2, quotes: 1 },
    answer: () => ({
      content: `To compare vendors fairly:\n\n${bullets([
        '**Line the quotes up item by item.** A lower price often means fewer hours, fewer staff or taxes left out.',
        '**Check what is excluded** - travel, overtime, setup, GST, service charges.',
        '**Read reviews for how problems were handled**, not just five-star praise.',
        '**Compare cancellation and refund terms** - they matter more than a small price gap.',
        '**Trust your gut on communication.** Slow, vague replies before you pay rarely improve after.',
      ])}\n\nLog each quote as an estimate under **Budget** so you can see the effect on your total before you commit.`,
    }),
  },
  {
    // Sent by the Local picks screen. Offline, the assistant cannot know a
    // city's vendors or prices, so it gives the method and points at the map
    // search, which does know them.
    id: 'local_planning',
    priority: 2,
    patterns: [/(getting married|marrying|get married) (in|at) [a-z]/, /planning a wedding there/, /(local|nearby) (vendors|picks|recommendations|suppliers)/, /(vendors|venues|photographers|florists|caterers) (near|around) (me|us|our|my)/],
    keywords: { local: 1, nearby: 1 },
    answer: (ctx) => {
      const place = ctx.location ? `**${ctx.location}**` : 'your city';
      return {
        content: `Planning a wedding in ${place} - here is how to get local quickly:

${bullets([
          '**Pick your season first.** Peak months (usually late spring and early autumn) cost more and book out 12+ months ahead. An off-peak month or a Friday or Sunday can save 20-40% on the venue.',
          '**Get three local quotes per vendor.** Prices vary a lot between neighbourhoods and suburbs, and the middle quote is usually the realistic one.',
          '**Book in this order:** venue, then caterer (if not in-house), photographer, and music - these are the ones that sell out. Florals, cake and stationery can follow.',
          '**Ask venues for their preferred vendors.** They know who shows up on time in that building.',
          '**Check the paperwork.** Marriage licence rules, waiting periods and noise or permit limits are set locally - look them up early.',
        ])}

Open **Local picks** on Home to search nearby venues, photographers, florists and more, with real reviews and photos.`,
      };
    },
  },
  {
    id: 'booking_timeline',
    priority: 1,
    patterns: [/when (should|do) (we|i) (book|hire|order|send|buy)/, /how (early|far in advance)/, /planning timeline/, /(timeline|schedule) for (planning|booking)/, /month.by.month/],
    keywords: { book: 1, advance: 1, timeline: 1 },
    answer: (ctx) => {
      const months = monthsLeft(ctx);
      const note =
        months == null
          ? ''
          : months < 6
            ? `\n\nYou have about **${months} months**, so compress this: book the venue, food and photographer this month, and everything else in the next 4-6 weeks. Many vendors keep late openings - just ask.`
            : `\n\nWith about **${months} months** to go, you are comfortably inside these windows.`;
      return {
        content: `A typical booking timeline:\n\n${bullets(BOOKING_WINDOWS.map(([what, when]) => `**${what}** - ${when}`))}${note}`,
      };
    },
  },
  {
    id: 'day_timeline',
    priority: 2,
    patterns: [/(wedding )?day (timeline|schedule|itinerary|plan|run.?sheet)/, /(timeline|schedule|itinerary|run of show) for the (wedding|day|big day)/, /order of events/],
    keywords: { itinerary: 2, schedule: 1 },
    answer: (ctx) => ({
      content: `Here is a sample timeline for ${ctx.ceremony ? `a ${ctx.ceremony.toLowerCase()}` : 'the day'} with an afternoon ceremony - shift it to suit your customs:\n\n${bullets([
        '**Morning** - hair and makeup (allow 45-60 min per person), getting-ready photos',
        '**2:30 pm** - vendors set up, photographer arrives',
        '**3:30 pm** - guests arrive, welcome drinks',
        '**4:00 pm** - ceremony (30-60 min, longer for traditional rituals)',
        '**5:00 pm** - family and couple portraits (keep a list of groups for the photographer)',
        '**6:00 pm** - guests seated, entrances',
        '**6:30 pm** - dinner, speeches between courses',
        '**8:30 pm** - first dance, then the party',
        '**10:30 pm** - send-off',
      ])}\n\nTips: build in **15 minutes of slack** between blocks, share the final version with every vendor and one trusted friend, and put a named person in charge of keeping it moving - not you.`,
    }),
  },

  // --- Etiquette -----------------------------------------------------------
  {
    id: 'etiquette_plus_one',
    priority: 2,
    patterns: [/plus.?ones?/, /bring (a )?(date|partner|guest)/],
    answer: () => ({
      content: `A common, fair plus-one policy:\n\n${bullets([
        '**Always** include partners of married, engaged or long-term couples - and invite them by name.',
        'Consider a plus-one for guests who will not know anyone else.',
        'Beyond that, it is your choice. Apply the rule evenly, so nobody feels singled out.',
        'Address the invitation exactly to who is invited. "Mr. and Mrs. Rao" is clear; "Mr. Rao and guest" gives a plus-one.',
      ])}\n\nIf someone asks for a plus-one you cannot offer: "We would love to, but we are keeping numbers tight - we hope you understand." Warm, short, no need to justify further.`,
    }),
  },
  {
    id: 'etiquette_children',
    priority: 2,
    patterns: [/(no|without) (kids|children)/, /(kids|children).*(invite|wedding|allowed)/, /adults?.only/],
    answer: () => ({
      content: `An adults-only wedding is completely acceptable - just communicate it kindly and consistently:\n\n${bullets([
        'Address invitations only to the adults. That is the primary signal.',
        'Add a gentle line on your website or information card: *"While we love your little ones, our celebration will be adults only."*',
        'Decide exceptions up front (flower girls, ring bearers, nursing babies) and apply them evenly.',
        'Consider listing local babysitters for out-of-town guests.',
        'Expect a few declines, and do not take them personally.',
      ])}`,
    }),
  },
  {
    id: 'etiquette_invitations',
    priority: 1,
    patterns: [/when (should|do) (we|i) send.*(invit|save.the.date)/, /save.the.date/, /rsvp (deadline|date|by)/, /invitation wording|word(ing)? (the|our)? ?invit/],
    keywords: { invitation: 1, invite: 1, wording: 2 },
    answer: () => ({
      content: `Stationery timing:\n\n${bullets([
        '**Save-the-dates:** 6-8 months before (8-12 for destination weddings)',
        '**Invitations:** 6-8 weeks before (10-12 for destination)',
        '**RSVP deadline:** 3-4 weeks before the wedding - your caterer will need numbers about 2 weeks out',
        '**Thank-you notes:** within about 3 months of the wedding',
      ])}\n\nClassic wording:\n\n*Together with their families, Priya and Arjun request the pleasure of your company at their wedding, on Saturday, the twelfth of December, at four o'clock in the afternoon.*\n\nWant me to **draft a save-the-date message** you can edit and send?`,
    }),
  },
  {
    id: 'etiquette_who_pays',
    priority: 1,
    patterns: [/who (pays|should pay|traditionally pays)/, /(parents|family) (pay|paying|contribut)/],
    answer: () => ({
      content: `There is no single rule any more - traditions vary widely by culture and family, and most couples now share costs in whatever way works.\n\n${bullets([
        'Have the money conversation **early and openly**, with each family separately if needed.',
        'Ask "would you like to contribute, and is there a part you would love to own?" rather than naming a figure.',
        'Be clear about whether contributions come with a say in decisions - this avoids most conflict later.',
        'Log every contribution in **Budget** so you always know your real total.',
      ])}`,
    }),
  },
  {
    id: 'etiquette_gifts',
    priority: 1,
    patterns: [/(registry|gift list|wishlist)/, /(cash|money) (gift|instead)/, /how much (should|to) (give|gift)/],
    keywords: { registry: 2, gift: 1 },
    answer: () => ({
      content: `On gifts and registries:\n\n${bullets([
        'Registries are optional but helpful - guests often prefer knowing what you would use.',
        'Include a range of prices so everyone can find something comfortable.',
        'Asking for cash or a honeymoon fund is widely accepted now; phrase it warmly: *"Your presence is the greatest gift. If you would like to give something, a contribution to our first home would mean a lot."*',
        'Share registry details on your website or by word of mouth rather than on the invitation itself.',
        'Keep a list of who gave what - you will need it for thank-you notes.',
      ])}`,
    }),
  },
  {
    id: 'etiquette_tipping',
    priority: 1,
    patterns: [/(tip|tipping|gratuity)/],
    answer: () => ({
      content: `Tipping vendors is appreciated but rarely mandatory. Check each contract first - many already include a service charge.\n\n${bullets([
        'Service staff, drivers and setup crews are the usual first priority.',
        'Hair and makeup artists are often tipped around 15-20% where that is the local custom.',
        'Owners of small businesses usually are not tipped - a glowing review and referral means more.',
        'Prepare labelled envelopes in advance and hand them to one trusted person to distribute on the day.',
      ])}`,
    }),
  },
  {
    id: 'etiquette_seating',
    priority: 1,
    patterns: [/seating (plan|chart|arrangement)/, /where (should|do) .* sit/, /table plan/],
    keywords: { seating: 2, table: 1 },
    answer: () => ({
      content: `A calmer way to do the seating plan:\n\n${bullets([
        'Wait until most RSVPs are in - usually 2-3 weeks before.',
        'Seat by **households and groups** first (family, school friends, colleagues), then balance tables.',
        'Put immediate family and elderly guests closest to you and away from speakers.',
        'Keep known tensions at separate tables - quietly, without making it obvious.',
        'Seat singles together at a lively table rather than as the odd one out.',
      ])}\n\nYour guest households in **Guests** are a good starting point for tables.`,
    }),
  },
  {
    id: 'etiquette_dress_code',
    priority: 1,
    patterns: [/dress code/, /what (should|do) (guests|people) wear/, /(black tie|cocktail attire|formal attire)/],
    answer: () => ({
      content: `Common dress codes, and what guests take them to mean:\n\n${bullets([
        '**Black tie** - tuxedos and floor-length gowns or formal traditional wear',
        '**Formal** - dark suits, long or elegant cocktail dresses',
        '**Cocktail / semi-formal** - suits or blazers, knee-length dresses',
        '**Festive / traditional** - vibrant traditional outfits welcomed',
        '**Casual or beach** - light fabrics, no jacket needed',
      ])}\n\nPut the dress code on your website and mention anything practical - an outdoor lawn (skip stilettos) or a temple ceremony (covered shoulders).`,
    }),
  },
  {
    id: 'etiquette_thank_you',
    priority: 1,
    patterns: [/thank.you (notes?|cards?|letters?)/, /(how|when) (to|should (we|i)) (say )?thank/],
    answer: () => ({
      content: `Thank-you notes:\n\n${bullets([
        'Send them within about **3 months** - sooner for gifts received before the wedding.',
        'Mention the specific gift and how you will use it; for cash, say what it goes toward.',
        'Include something personal: a moment you shared with them on the day.',
        'Split the list between you so it gets done.',
      ])}\n\nWant me to **draft a thank-you note** you can adapt?`,
    }),
  },

  // --- Emergencies ---------------------------------------------------------
  {
    id: 'emergency_weather',
    priority: 2,
    patterns: [/(rain|storm|weather|monsoon|heat|too hot|wind)/],
    answer: () => ({
      content: `A weather plan, so rain is an inconvenience rather than a crisis:\n\n${bullets([
        'Confirm the venue\'s **indoor backup space** and when the call must be made (usually 24-48 hours before).',
        'Get a **tent or marquee quote now** and ask how late you can book it.',
        'For heat: shade, water stations, fans, and a ceremony time after 4 pm.',
        'Keep umbrellas, towels and a few pairs of flat shoes in the emergency kit.',
        'Name one person to make the weather call with the venue, so you do not have to.',
      ])}\n\nRainy-day photos are often some of the best ones. Tell your photographer to plan for them.`,
    }),
  },
  {
    id: 'emergency_vendor',
    priority: 3,
    patterns: [/(vendor|photographer|caterer|venue|dj|florist|decorator|planner).*(cancel|backed out|pulled out|no.show|went out of business|not respond|ghost)/, /(cancel|backed out|pulled out).*(vendor|photographer|caterer|venue|dj)/],
    answer: () => ({
      content: `First - breathe. This happens more often than people think, and it is almost always recoverable.\n\n${bullets([
        '**Get it in writing.** Ask them to confirm the cancellation by email, and re-read your contract for refund and replacement clauses.',
        '**Ask them for a replacement.** Reputable vendors keep a network and often find cover.',
        '**Call your other vendors.** Your venue, planner or photographer will know who is free.',
        '**Widen the net** - newer vendors, nearby cities, and weekday specialists often have late availability.',
        '**Claim the deposit back** in writing, citing the contract; escalate through your card provider if needed.',
      ])}\n\nWant me to **draft a message** to the vendor asking for a refund and confirmation?`,
    }),
  },
  {
    id: 'emergency_day_of',
    priority: 2,
    patterns: [/emergency kit/, /(something|things) (goes|go) wrong/, /day.of (problem|emergency|disaster)/, /(lost|forgot) (the )?(ring|rings)/, /(dress|outfit) (tore|ripped|stain|broke)/],
    answer: () => ({
      content: `An emergency kit to pack, and a plan for the classics:\n\n${bullets([
        '**Kit:** safety pins, sewing kit, fashion tape, stain remover pen, painkillers, plasters, phone charger, snacks, water, tissues, spare copies of vows and the timeline',
        '**Outfit mishap:** safety pins and tape fix most things; a stain pen or chalk hides the rest',
        '**Rings forgotten:** borrow a stand-in for the ceremony - nobody will notice, and the photos can be retaken',
        '**Running late:** tell the one person running the timeline and let them re-order; guests rarely notice 20 minutes',
        '**Someone unwell:** know where the nearest pharmacy and hospital are',
      ])}\n\nMost importantly: appoint a day-of point person so problems go to them, not you.`,
    }),
  },
];
