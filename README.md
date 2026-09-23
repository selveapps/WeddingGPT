# WeddingGPT

A wedding-planning workspace built with Expo and React Native (JavaScript).

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
  index.jsx                Launch gate - waits for hydration, then routes
  design-system.jsx        Component gallery
  (tabs)/                  The five-tab shell (Home, Planning, Guests, Budget, AI)
  onboarding/              Welcome, [step] (all 11 questions), plan reveal
  home/                    Countdown detail, planning progress detail
  planning/                task/new, task/[id], task/[id]/edit, category/[id]
  budget/                  setup, category/[id], expense/new, expense/[id]
  guests/                  new, [id], household/[id]

src/
  design-system/
    tokens/                colour, type, spacing, radii, shadow, motion, layout
    theme/                 ThemeProvider, useTheme, useMotion, font loading
    components/            35 exported components - the only styling surface
  features/                Composite parts shared by two or more routes
    onboarding/            ChoiceAnswer, MultiAnswer, DateAnswer
    planning/              TaskRow, TaskForm
    budget/                ExpenseForm
    guests/                GuestRow, GuestForm
    shared/                DateField, MoneyField
  models/                  Entity factories, status enums, derived calculations
    onboarding.js          The 11-question script, as data
    planGeneration.js      49-task checklist template + plan generator
  store/                   zustand stores, persisted via StorageService
  services/
    storage/               StorageService contract + AsyncStorage/memory impls
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

**Money is integer minor units.** Paise/cents, never floats. Formatting happens
at the edge in `lib/currency` (`₹4.5L`, `₹1.2Cr` compact forms included).

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
| 4 — AI | Chat, context system, conversation persistence, confirmation workflow | Not started - tab is a placeholder |
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

---

## Not yet wired

- **AI provider.** `AIService` is designed for a mock-first implementation with a
  real provider behind the same interface. Neither exists yet (Phase 4).
  When a real provider is added, the API key must sit behind a backend proxy —
  shipping it in the app bundle exposes it on every device.
- **App icon and splash artwork.** Currently Expo defaults. Branded assets are a
  Phase 7 item.
- **Subscriptions.** `SubscriptionService` is specified but not implemented
  (Phase 6).
