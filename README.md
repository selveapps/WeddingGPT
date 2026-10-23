<p align="center">
  <img src="assets/icon.png" alt="WeddingGPT logo" width="120" height="120" />
</p>

<h1 align="center">WeddingGPT</h1>

<p align="center">
  <em>Your wedding, thoughtfully planned.</em><br />
  A wedding-planning workspace built with Expo and React Native (JavaScript).
</p>

<p align="center">
  <a href="https://github.com/selveapps/WeddingGPT/actions/workflows/ci.yml"><img src="https://github.com/selveapps/WeddingGPT/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
  <img src="https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white" alt="Expo SDK 57" />
  <img src="https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black" alt="React Native 0.86" />
  <img src="https://img.shields.io/badge/node-24-339933?logo=node.js&logoColor=white" alt="Node 24" />
  <img src="https://img.shields.io/badge/platforms-iOS%20%7C%20Android-lightgrey" alt="iOS and Android" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-proprietary-C93862" alt="License: proprietary" /></a>
</p>

<p align="center">
  <a href="#running-it">Run it</a> &middot;
  <a href="CONTRIBUTING.md">Contribute</a> &middot;
  <a href="SECURITY.md">Security</a>
</p>

Built against the Product & Technical Requirements Document. The PRD defines
seven delivery phases; this repo currently has **Phases 1-3 complete**:
Foundation, Onboarding, and the core workspace (Home, Planning, Budget, Guests).

---

## Running it

```bash
npm install
npm start
```

Then scan the QR code with **Expo Go** on your phone (same Wi-Fi as your
computer), or enter the `exp://<your-lan-ip>:8081` URL manually.

| Script | What it does |
| --- | --- |
| `npm start` | Dev server with QR code |
| `npm run start:clear` | Same, but clears the Metro cache first |
| `npm run android` | Open on a connected Android device/emulator |
| `npm run ios` | Open on an iOS simulator (macOS only) |
| `npm run web` | Browser preview |
| `npm run doctor` | Check dependency/version health |
| `npm test` | Run the Jest test suite |
| `npm run lint` | Lint with ESLint (Expo config) |
| `npm run format` | Format with Prettier |
| `npm run build` | Export production bundles with `expo export` |

### Node version

React Native 0.86 and Metro 0.84 require Node `^20.19.4 || ^22.13.0 || ^24.3.0 ||
>=25`. Node 24 LTS is what this is developed and verified against. If `npm start`
prints an "outdated and unsupported" banner, your Node is below that range.

`npx expo-doctor` passes 21/21 checks on a clean clone.

### Design-system gallery

Navigate to `/design-system` in the app to see every component, token, colour
and icon rendered on a real device. It is the fastest way to check a token
change across the whole library at once.

---

## Architecture

The PRD (s.19) asks for a layered codebase, not a handful of large screens.
The dependency direction is strictly one way:

```text
app/          expo-router routes - presentation and wire-up
  ↓
src/features  composite screen parts shared across routes (forms, rows)
  ↓
src/store     zustand stores - own all mutation
  ↓
src/models    entity factories, enums, derivation
  ↓
src/services  storage, analytics, AI, subscriptions (swappable)
```

`src/features/` holds the pieces two or more routes need but that are too
domain-specific for the design system - `TaskForm` is used by both add and edit,
`GuestRow` by the guest list and the household screen. Anything used by exactly
one route stays in that route's file.

`src/design-system` and `src/lib` are leaves — everything may import them, and
they import nothing from the layers above.

### Directory map

```text
app/                       Routes. File-based, via expo-router.
  _layout.jsx              Fonts, splash, providers, root stack
  index.jsx                Launch gate - brand intro while hydrating, then routes
  assistant/               [id] - a conversation with WeddingGPT
  design-system.jsx        Component gallery
  (tabs)/                  The five-tab shell (Home, Planning, Guests, Budget, AI)
  onboarding/              The journey (hello + 4 steps, one screen), plan reveal
  home/                    Countdown detail, planning progress detail
  planning/                task/new, task/[id], task/[id]/edit, category/[id]
  budget/                  setup, category/[id], expense/new, expense/[id]
  guests/                  new, [id], household/[id]
  account/                 Account (sign-in status), sign-in, reminders
  vendors/                 list, new, [id], [id]/edit

src/
  design-system/
    tokens/                colour, type, spacing, radii, shadow, motion, layout
    theme/                 ThemeProvider, useTheme, useMotion, font loading
    components/            35 exported components - the only styling surface
  features/                Composite parts shared by two or more routes
    launch/                BrandIntro (logo animation)
    home/                  DateSheet (add or change the date from the dashboard)
    assistant/             MessageBubble, MessageText, Composer, SuggestionCard, review sheet
    onboarding/            Companion, ChoiceAnswer, DateAnswer, buildWorkspace
    auth/                  AccountButton, sign-in form validation
    planning/              TaskRow, TaskForm
    budget/                ExpenseForm
    guests/                GuestRow, GuestForm
    shared/                DateField, MoneyField
  models/                  Entity factories, status enums, derived calculations
    onboarding.js          The 4-step script, as data
    planGeneration.js      49-task checklist template + plan generator
  store/                   zustand stores, persisted via StorageService
  services/
    storage/               StorageService contract + AsyncStorage/memory impls
    ai/                    AIService, on-device provider (local/), Claude proxy client
    auth/                  Account server client, secure session storage
    analytics/             Provider-agnostic event tracking
  navigation/              Route table + custom tab bar
  lib/                     id, date, currency, validation, haptics
```

### Conventions worth knowing

**Nothing styles itself.** Screens compose components from
`src/design-system/components` and read tokens via `useTheme()`. There are no
raw hex values, font sizes or pixel paddings outside `src/design-system/tokens`.

**Derive, don't cache.** Budget totals, RSVP counts and planning progress are
computed from the stores on read (`summariseBudget`, `summariseRsvps`,
`calculateProgress`). There are no counters to invalidate, so two screens can
never disagree.

**Normalised collections.** Stores keep entities as `{ byId, allIds }`, so
updating one item in a list of 300 is a single key write.

**Mutation lives in stores.** Screens call store actions; actions own the state
change *and* the analytics event. Completing a task fires
`TASK_COMPLETED` once, from `planningStore`, no matter which of the four
screens triggered it.

**Money is integer minor units.** Cents, never floats. Formatting happens at
the edge in `lib/currency` (`$45K`, `$1.2M` compact forms included).

**Dates are `YYYY-MM-DD` strings.** A wedding happens on a calendar day; storing
an instant makes the countdown drift across timezones.

**Accessibility and Reduce Motion are not optional.** Animate through
`useMotion()`, which collapses durations to zero when the OS asks. Every
tappable surface goes through `Touchable`, which enforces a 44pt target.

---

## Phase status

| Phase | Scope | Status |
| --- | --- | --- |
| 1 — Foundation | Architecture, design system, navigation, persistence, data models, components | **Done** |
| 2 — Onboarding | Conversational flow, per-answer persistence, resume, personalised plan | **Done** |
| 3 — Core workspace | Home, Planning, Budget, Guests | **Done** |
| 4 — AI | Chat, context system, conversation persistence, confirmation workflow | **Done** |
| 5 — Vendors & Vision | Vendor management, style quiz, moodboard | Models only, no screens |
| 6 — Monetisation | Paywall, subscription states, purchase flow | Not started |
| 7 — Polish | Animations, haptics, accessibility, final UX pass | Ongoing |

### What Phase 1 delivered

- **Design system** - full token set (colour with light/dark schemes, typography,
  spacing, radii, shadows, motion, layout) and 35 exported components covering buttons,
  cards, chips, badges, list rows, text fields, segmented controls, progress
  bars and rings, animated numbers, avatars, checkboxes, skeletons, bottom
  sheets, confirmation sheets, toasts and all four non-content states.
- **Original icon set** - 42 icons drawn in-house on a 24pt grid. No third-party
  icon packs, per the PRD's originality requirement.
- **Data models** - every entity in PRD s.21 with stable IDs, created/updated
  timestamps, version and sync-status fields, plus explicit status enums with
  display metadata.
- **Persistence** - `StorageService` abstraction with AsyncStorage and in-memory
  implementations, wired into zustand stores. Rehydration is gated at launch so
  a returning user never sees an empty workspace.
- **Navigation** - five-tab shell with a custom tab bar and a centralised route
  table.
- **Analytics** - provider-agnostic abstraction with the full event taxonomy
  from PRD s.26 already defined.

### What Phase 2 delivered - Onboarding (PRD s.4)

- **Eleven questions, one file.** `ONBOARDING_STEPS` in `models/onboarding.js`
  is the whole script; `app/onboarding/[step].jsx` renders whichever entry the
  URL points at. Changing the flow's copy, order or length is one edit, and the
  eleven screens cannot drift apart.
- **Nothing is ever lost.** Answers are written to the store on every keystroke
  and every tap, not on Continue. The resume marker is set when a step is
  *shown*, so quitting while reading question 7 returns you to question 7
  (s.4.3).
- **A real plan at the end** (s.4.4). `planGeneration.js` holds a 49-task
  checklist with per-task "months before the wedding" metadata, and turns it
  into dated tasks from the couple's own date, plus a seeded budget split.

Two deliberate choices in the generator:

1. Tasks whose natural window has already passed are **pulled forward and
   staggered**, not generated overdue. A couple three months out should not open
   the app to thirty red rows - s.27 asks for calm, and an overdue list you were
   handed rather than earned is not information.
2. Templates belonging to a longer window than the couple has are **dropped**
   unless marked `essential`. Someone eight weeks out still gets "file the
   paperwork"; they do not get "shortlist venues over twelve months".

### What Phase 3 delivered - Core workspace (PRD s.6-9)

- **Home** - countdown, next best action, upcoming deadlines, planning progress,
  budget and RSVP snapshots, quick actions, plus countdown and progress detail
  screens.
- **Planning** (s.7) - tasks bucketed by time (Overdue, This week, This month,
  Later, No date, Snoozed, Done), five filters, a category filter, three sorts,
  task detail with snooze/reassign/delete, add and edit forms, and a
  per-category drill-down. Completing a task offers Undo, because the list moves
  out from under the checkbox.
- **Budget** (s.8) - spent, committed and remaining kept genuinely separate;
  over-budget warning; setup with a live split preview; category drill-down that
  reports over-allocation rather than blocking it; expense add/edit/delete and
  payment tracking.
- **Guests** (s.9) - RSVP counts derived on render, search across name,
  household, email and tags, RSVP filters, guest detail where changing an RSVP
  is one tap, households whose invitation status cascades to their members, and
  multi-select for bulk RSVP, invitation and delete.

### Launch, onboarding and the dashboard (PRD s.3.1, s.4)

- **Brand intro.** `BrandIntro` draws the two rings in, settles the gilt stone,
  raises "WeddingGPT" letter by letter and sweeps a hairline beneath it - about
  two seconds, tap to skip, instant under Reduce Motion. It plays while the
  stores rehydrate, so it doubles as the loading state.
- **Launch error state.** If storage fails to rehydrate, zustand never reports
  the store as ready and the app used to wait forever. After 8s the gate now
  shows an error with Retry (`rehydrateAllStores`).
- **Sign-in is optional.** The workspace lives on the device; there is no
  account gate. Routing is simply: no wedding yet -> onboarding, otherwise ->
  Home. The person button beside the bell opens Account, where people can sign
  in or create an account (see "Accounts").
- **Onboarding is one screen.** A companion (the rings mark) breathes, hops when
  an answer lands, and says each question in a speech bubble. Four steps -
  names, date, guests, budget - and the choice steps advance on tap. Skip is on
  every step and goes straight to the dashboard.
- **There is always a dashboard.** `buildWorkspace` turns whatever was answered,
  including nothing, into a wedding, a checklist and (if given) a budget. It is
  idempotent; Home calls it too, so a deep link before onboarding still lands
  on a working dashboard. A missing date is a card on Home that opens
  `DateSheet`, not a blocker.
- **Haptics and motion.** Motion is deliberately quiet: no bouncing, springing
  or staggered cascades. The companion mark is still, presses dip opacity
  rather than scale, and new content fades in place. The one exception is the
  launch intro (`features/launch/BrandIntro.jsx`): a ~3s skippable hello where
  two graceful swans (`launch/elegantSwanArt.js`, separate from the cute
  mascot) glide in and make a heart with their necks (`WeddingSwans`),
  the wordmark rises and hearts drift up (`FloatingHearts`, which continues behind the onboarding welcome). A selected option fills and shows a check; the next step can be ticked
  off from Home. All of it collapses to instant under Reduce Motion, and every
  haptic goes through `lib/haptics`.
- **Currency.** US launch: USD only, no currency picker. Budget bands are in
  `models/onboarding.js` (`budgetOptionsFor`). Older workspaces stored in
  another currency format as USD and are moved to USD on the next budget save.
- **Partner and local.** Onboarding asks only for your own name. Home has
  *Invite your partner* (native share sheet; set `EXPO_PUBLIC_INVITE_URL` to
  include a link) and *Venues and vendors* (`app/home/local.jsx`), which saves
  the wedding city and opens map searches per vendor category.
- **Vendors.** *Your vendors* on Home opens `/vendors`: the couple's
  shortlist, with status, quote, contact details and a deposit/balance payment
  plan. Payments are ticked off as paid, upcoming ones are listed with overdue
  flags, and a booked vendor can be added to the budget as a committed
  expense. The model and payment maths are in `models/vendors.js`, the store
  in `store/vendorStore.js` (in the launch hydration gate), the screens in
  `features/vendors`. This graduated the Labs vendor manager; anything saved
  there is imported once, the first time Vendors opens.
- **Read a quote.** *Read a quote* in Vendors (and on each vendor): paste a
  quote or contract and get the total, deposit, balance, line items, due
  dates and fine print to look at twice (non-refundable money, cancellation,
  overtime, minimums), plus questions to ask when the numbers do not add up.
  Save it as a new vendor, or as an existing vendor's quote and payment plan
  (payments already made are kept). Model in `models/quoteReader.js`.
  Graduated from Labs.
- **Backup and restore.** *Account > Backup* downloads every part of the plan
  that syncs as one checked file, and restores one: the backup replaces the
  phone's own plan after showing what is in it (never a synced wedding, which
  the account keeps). Works without an account. The file is checked as
  untrusted input before anything is written. Model in `models/backup.js`.
  Replaces the Labs backup and partner sync, which real sync has superseded.
- **Famous venues.** `models/venues.js` holds a hand-picked list of
  well-known wedding venues for about 20 major US metros (matched by city,
  neighbourhood or suburb). They show on Home, on the plan reveal and on the
  local screen; every venue opens a map search for the real listing. Every
  city also gets style searches (gardens, barns, rooftops...).
- **RSVP website.** *RSVP website* on the Guests tab (once the wedding is
  synced) sets up a public page and gives every household a link and a code;
  guests reply in the browser, without the app, and their answers update the
  guest list when the app syncs. A guest invited to several events answers
  each one, and each event's counts use those answers (slice F1, switchable
  under the RSVP questions). Server: `server/auth/rsvp`; app: `features/rsvp`.
- **Wedding party.** *Wedding party* (Guests tab): add people from the guest
  list (keeping their contact details) or by name, each role arriving with the
  jobs it usually covers; tick jobs off, add your own, note outfits and sizes,
  and send each person their open jobs. Members sync (`partyMembers`).
  Graduated from Labs; members saved there are imported once.
- **Gifts and thank-yous.** *Gifts and thank-yous* (Guests tab): log each
  gift as it arrives (matched to the guest it came from), see when its note is
  due - two weeks for a gift before the wedding, three months after - write it
  from a warm first draft, share it and mark it sent. Gifts sync (`gifts`) and
  export as CSV. Graduated from Labs; gifts logged there are imported once.
- **Seating chart and meals.** *Seating chart* (Guests tab): tables, auto-seating
  that keeps households together, keep-apart pairs, and on a wide screen the
  tables in a grid beside the guests still to seat. Tables and pairs sync
  between partners (`seatingTables`, `seatingRules`); a deleted guest frees
  their seat. Each event has its own tables (slice F2), seating the guests
  invited to it who have not declined it; keep-apart pairs hold everywhere. *Meals for the caterer* counts plates, meal choices and allergies
  to check, and exports a CSV - for the whole wedding or one event (G1). Both graduated from Labs; earlier Labs seating
  plans are imported once.
- **Wedding website.** *Wedding website* on the Guests tab: welcome,
  schedule with directions, travel and stays, registry and FAQ, published at the
  RSVP page address as off, public or password-protected, and hidden from
  search engines unless the couple opts in. Server: `server/auth/rsvp/site*`.
- **Events.** *Events* on the Planning tab: the mehndi, ceremony, reception,
  brunch, each with its own date, times, place, dress code and guest list
  (everyone, or chosen guests with invited and attending counts). Tasks and
  expenses can belong to an event, Planning and Budget filter by one, and the
  wedding website can fill its schedule from them (*Use my events*). Events
  sync (`events`); deleting one keeps its tasks and costs, and a deleted guest
  leaves every event's list. Model in `models/events.js`, times in
  `lib/time.js`, screens in `features/events`.
- **Budget reports.** *Reports* on the Budget tab: each category's plan
  against what is paid, committed and estimated, with overspends flagged; the
  same split by event; and what is still to pay in each of the next twelve
  months, with overdue payments first. *Export as CSV* gives all three for a
  spreadsheet. Model in `models/financeReport.js`.
- **Checklists for each event.** Adding a mehndi, sangeet, haldi, rehearsal
  dinner, welcome party, brunch, ceremony or reception offers that event's
  usual tasks, dated back from the event and linked in order; the couple
  unticks what does not apply and nothing is added until they press Add.
  *Suggested tasks* on an event offers what is not on the checklist yet.
  Content in `models/eventTemplates.js`.
- **Tasks that wait for others.** On a task, *Wait for another task* links
  it to what has to happen first ("Send the invitations" waits for the guest
  list). A waiting task says so, stays off the daily checklist and the next
  best action until its prerequisites are done, and can still be ticked off.
  Loops are refused; deleting a task frees what waited for it; a new plan comes
  with the obvious links. Model in `models/dependencies.js`.
- **Run of show.** *Run of show* on the Planning tab (and on each event): what
  happens when on the day, minute by minute, with overlaps flagged. Running
  late? Push an item and everything after it moves, with undo. Each event has
  its own; share it as text with vendors and the wedding party. Items sync
  (`runOfShow`); deleting an event deletes its run of show. Graduated from the
  Labs day-of timeline, which is imported once as the wedding day.
  *Share with a vendor* (once the wedding is synced) makes a read-only link
  for one vendor: the day's schedule, the place and the contacts you tick,
  never guests or costs. Links can be turned off and expire a week after the
  event (slice F3; threats D1-D6 in `docs/planning/F-multi-event-guests.md`).
- **Packing lists.** *Packing lists* on the Planning tab: the emergency kit,
  the getting-ready bag, the box for the venue and the honeymoon. A list starts
  from the usual things only when the couple asks; tick, add, rename (long
  press), remove with undo, put back removed defaults, share. Items sync
  (`packingItems`); template items have stable ids, so two phones starting
  the same list never double it. Graduated from Labs; imported once.
- **Your style.** *Your style* on the Planning tab: a five-tap style quiz, the
  palettes that suit the result, *Save as our style* (writes `styleTags`, the
  field the profile edits) and a brief for vendors that includes the vision
  board's ideas. Saved on the wedding, so it syncs. Graduated from the Labs
  style studio; its moodboard notes and links move into the vision board once.
- **Assistant actions.** Ask the assistant in plain words - "add a $2,000
  florist expense", "spent $450 on the cake", "mark the Smiths as attending",
  "remind me to call the DJ by March 3" - and it answers with a proposal you
  edit and confirm; nothing changes before that. These are understood on the
  phone (`models/assistantActions.js`), because they need the guest list,
  which is never sent to the assistant. Questions still go to the assistant.
  Graduated from Labs.
- **Guest spreadsheets.** *Spreadsheet* on the Guests tab exports the list as
  CSV (a download on the web, the share sheet on a phone) and imports one:
  load a file or paste rows, check which column is which (guessed from the
  header), preview, then import. Duplicates and rows that need a fix are shown
  with the reason and skipped; households are matched by name. Logic in
  `features/guests/lib/guestCsv.js`, CSV reading in `lib/csv.js`.
- **Wide screens.** At 900 px and wider (`useBreakpoint`) the guest list is a
  sortable table with a checkbox column (`features/guests/GuestTable.jsx`).
- **Import guests from contacts.** `app/guests/import.jsx` reads the address
  book via `expo-contacts` (permission asked only on that screen), skips
  people already on the list (phone, email or name match) and bulk-adds the
  rest. Needs a development build or store build; not available on web.
- **Mascot and app icon.** The mascot is a swan couple - a bride with a veil
  and flower crown and a groom with a top hat and bow tie - whose necks make a
  heart. They are drawn once in `features/mascot/swanArt.js`, and the icon
  tile (the swans on ivory-to-rose, the app's own palette) once in
  `features/mascot/appIconArt.js`. Those two files are the only source: the
  in-app `<Mascot />` and `npm run icons`,
  which exports the store icon, Android adaptive icon, favicon and the
  Android notification icon (a white silhouette, as Android requires) to
  `assets/`. The native splash is plain ivory. The script renders with
  headless Chrome or Edge (`CHROME_PATH` to override). Icons only change in a
  new native build, not in Expo Go.
- **Daily checklist.** Each morning Home shows up to three plan tasks for today
  (`models/daily.js`, held for the day in `planningStore.today`). An 8am local
  notification names the day's tasks; it is scheduled 14 days ahead and
  rebuilt whenever the plan changes.

### What Phase 4 delivered - The assistant (PRD s.12-14)

Layered exactly as s.14 draws it: **UI -> `aiStore` -> `AIService` -> provider**.

- **Two providers, one interface.** The *on-device* provider
  (`services/ai/local`) answers from a curated knowledge base - 45 intents, several with
  sub-topics, across the couple's own plan, budget and RSVPs, etiquette, vendor questions,
  timelines, emergencies, message drafting, and customer-support questions about
  the app itself. It is free, instant and works offline. The *remote* provider
  sends the conversation to Claude through `server/ai-proxy`. With a proxy
  configured, the on-device assistant still answers whenever the proxy is
  unreachable, and says so under the reply.
- **Context, not the database.** Each question carries `buildWeddingContext`:
  countdown, formatted budget totals, RSVP counts, progress, overdue and upcoming
  task titles. Never guest names or contact details. The chat shows what it can
  see as chips.
- **The AI never writes (s.13).** Checklists and drafted messages arrive as
  suggestions. The review sheet lets the couple rename or remove tasks, or edit
  the message; tasks are created only on "Add to plan", and a message is only
  ever sent by the couple, through the system share sheet.
- **Every state.** Thinking (typing dots, static under Reduce Motion), a
  progressive reveal, error with Retry, and replies interrupted by the app
  closing come back as retryable rather than stuck.
- **Persistence.** Conversations, messages and suggestions persist; recent
  conversations are listed on the Assistant tab (long-press to delete).

### Connecting the assistant to Claude

The API key lives on a server, never in the app.

```bash
cd server/ai-proxy
npm install
cp .env.example .env      # add ANTHROPIC_API_KEY and an APP_TOKEN
npm start                 # http://localhost:8787
```

Then in the app root, copy `.env.example` to `.env`, set
`EXPO_PUBLIC_AI_PROXY_URL` (your computer's LAN IP when testing on a phone) and
`EXPO_PUBLIC_AI_APP_TOKEN`, and restart with `npm run start:clear`.

The proxy uses `claude-opus-5` with server-side refusal fallbacks enabled
(`fallbacks: "default"`), caches the system prompt, and exposes two strict tools
(`propose_tasks`, `draft_message`) so proposals come back structured. `AI_EFFORT`
(default `medium`) trades answer depth against chat speed. To deploy, run it
anywhere Node 20+ runs and put it behind HTTPS.

### Accounts

Sign-in is optional and runs through `server/auth`, a small Node server that
keeps accounts in SQLite using Node's built-in `node:sqlite` - no npm
dependencies.

The same server holds **workspaces** (one per wedding) and their members, the
first slice of accounts and sync. The design, API contract and threat model
are in `docs/planning/M1-accounts-sync-design.md`. Every workspace route goes
through one membership check, and a workspace the caller is not a member of
answers 404, so its id cannot be probed. Workspaces sync record by record
through `POST /v1/workspaces/:id/sync/push` and `GET .../sync/pull`: the server
orders writes, a conflicting push wins but returns the copy it overwrote, and
deletes are tombstones with their contents removed.

In the app, **Account > Sync** backs up the phone's wedding to the account, or
opens the account's wedding on another phone (the phone's own wedding stays as
it is, and comes back on sign-out). Changes sync two seconds after an edit and
when the app opens; edits made on two phones at once are listed there with the
option to restore the other version. Once the wedding is synced, *Invite your
partner* (Home, or Account > Planning together) sends a link that works once,
for 7 days; it opens `/invite/[token]`, where the partner signs in and joins.
The owner can remove the partner and a partner can leave. **Account > Your
data** downloads everything the server holds for the account as a JSON file,
or deletes the account (password again; shared weddings pass to the partner,
solo ones are deleted; the phone's own plan stays). Engine: `services/sync`; reminder
preferences and assistant chats stay on each phone. The sync integration test
runs the real client against a real server in CI
(`SYNC_SERVER_URL=... npx jest realServer`).

```bash
cd server/auth
cp .env.example .env      # set an APP_TOKEN
npm start                 # http://localhost:8788
npm test                  # node --test
```

Then set `EXPO_PUBLIC_AUTH_URL` (LAN IP on a phone) and
`EXPO_PUBLIC_AUTH_APP_TOKEN` in the app's `.env` and restart with
`npm run start:clear`. Without `EXPO_PUBLIC_AUTH_URL`, the Account screen says
accounts are not switched on and everything else works as before.

What is stored, and how:

- **Passwords** only as salted scrypt hashes. The plain password never touches
  the database or the logs.
- **Sessions** as random 256-bit tokens, stored only as SHA-256 hashes, valid
  for 30 days. A copy of the database is therefore not a set of working logins.
- **On the phone**, the token sits in the Keychain or Keystore via
  `expo-secure-store`, not in AsyncStorage. The web build uses browser storage.
- Sign-in answers the same way for an unknown email and a wrong password, and
  sign-in and sign-up are limited to 10 attempts a minute per address.

The database defaults to `server/auth/data/auth.db`, which is git-ignored. Back
it up: it holds every account. To deploy, run the server anywhere Node 24+ runs
and put it behind HTTPS - tokens and passwords must never cross plain HTTP.

`expo-secure-store` is a native module, so a store build needs a new native
build (`eas build`), not just an over-the-air update. Expo Go already includes
it.

---

## Not yet wired

- **Account features beyond sign-in.** There is no password reset, email
  verification or account deletion yet. The wedding workspace still belongs to
  the device, not the account: it does not sync, and a second account signed in
  on the same phone sees the same wedding. Syncing needs the stores to be
  partitioned per account and a sync endpoint on the server.

- **Claude, live.** The proxy is built and its request handling is tested, but
  it has not yet been run against the real API from this repo - that needs your
  API key (see "Connecting the assistant to Claude").
- **App icon and splash artwork.** Currently Expo defaults. Branded assets are a
  Phase 7 item.
- **Subscriptions.** `SubscriptionService` is specified but not implemented
  (Phase 6).
