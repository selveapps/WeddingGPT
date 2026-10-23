# M0 — Baseline and audit

Milestone M0 of the Codebase Expansion Team Playbook: measured LOC, a clean
environment, a route and module inventory, and known defects. Phases 0–3 of
the playbook. The roadmap at the end re-estimates Phase 4 for the team's
current goal of **80,000–100,000 production LOC**.

## Baseline evidence

| Item | Value |
| --- | --- |
| Commit measured | `77ba740` (main), 23 October 2026 |
| Branch for this work | `feature/platform-expansion` |
| Node / npm | 24.21.0 / 10.8.3 (matches `.nvmrc` and CI) |
| Install | `npm ci` fails on Windows while VS Code's ESLint extension holds `@unrs/resolver-binding-win32-x64-msvc/*.node` open. Close VS Code (or run `npm install`) and it succeeds. Lockfile unchanged. |
| `npm run doctor` | 1 check fails: `expo-notifications` 57.0.23, expected ~57.0.24 (Expo patch published 23 Oct). Fix: `npx expo install --fix`. |
| Jest | 33 suites, 324 tests, all pass |
| Lint | 0 errors, 40 warnings |
| `server/auth` tests | 16 pass |
| `server/ai-proxy` | `node --check` passes |
| Launch | `expo export --platform web` bundles cleanly. Not yet launched on a device for this milestone. |

### LOC (`python scripts/count-production-loc.py`)

Nonblank physical lines in Git-tracked `.js/.jsx/.mjs/.cjs`. Tests counted
separately.

| Directory | Production LOC | Test LOC |
| --- | ---: | ---: |
| src | 25,616 | 2,582 |
| app | 6,067 | — |
| server | 670 | 162 |
| scripts | 132 | — |
| (root) | 69 | — |
| **Total** | **32,554** | **2,744** |

The script is the playbook's, with one change: test files named `*.test.*`
outside test folders (e.g. `server/auth/app.test.mjs`) are counted as tests,
as the playbook's metric policy requires. **The team should agree this rule
before the script is committed** (playbook §4).

To reach 80,000–100,000: **+47,000 to +67,000 production lines.**

## Route and module inventory

Tabs: Assistant, Home, Planning, Guests, Budget. Pushed screens: onboarding
and plan reveal, task/category/expense/guest/household detail and forms,
guest import, countdown, progress, local vendors, inbox, account, sign-in,
reminder settings, assistant conversation, design-system gallery.

Persisted stores in the launch gate: wedding, planning, budget, guest, AI,
notification. Outside it: auth (by design), vendor (see defect 3), and one
store per Labs prototype.

Servers: `server/ai-proxy` (Claude), `server/auth` (accounts, SQLite).

## Findings

### Defects and risks

1. **Route table points at screens that do not exist.** `Routes.vendors`,
   `vendorCategory`, `vendorDetail`, `vision`, `styleQuiz`, `moodboard`,
   `inspirationDetail`, `paywall`, `weddingDetails`, `subscription` and
   `privacy` have no file under `app/`. Nothing links to them today, so no
   user can hit them, but the first link added will 404.
2. **5,075 lines of unreachable code in `src/features/profile`.** Profile
   form, booking tracker, vendor contacts and a wedding timeline. Nothing in
   `app/` imports it. It has tests, so it is real work — it needs a route or
   a decision to remove it.
3. **`vendorStore` is not in the launch hydration gate.** Harmless while
   only unreachable code uses it; once a vendor screen ships, it will flash
   an empty list on launch. Add it to `STORES` in `src/store/index.js` when
   vendors graduate.
4. **AI proxy drops the connection on oversized requests** instead of
   returning 413 (`readBody` destroys the socket). Fixed in `server/auth`;
   the proxy still has it.

### Duplicated logic

- **Vendors exist three times:** `models/vendors.js` + `store/vendorStore.js`
  (used only by the unreachable profile booking UI), `labs/vendors`
  (separate model and store), and the declared but missing `/vendors` routes.
  Pick one model and one store before building more vendor features.
- **Timelines exist twice:** `features/profile/timeline` (unreachable) and
  `labs/timeline` (day-of run of show). Check whether they are the same
  feature before graduating either.
- `labs/shared/dates.js` and `money.js` are text parsers (find dates and
  amounts in pasted text), **not** copies of `lib/date` and `lib/currency`.
  No action.

### Test coverage gaps

Covered: `lib/*`, models (plan generation, budget, daily, base), profile
helpers and validation, booking and contacts, auth (client, store, server),
reminder scheduling, every Labs model.

Not covered: the zustand stores other than auth (planning, budget, guest,
AI, wedding, notification), the AI intent handlers in
`services/ai/local/intents`, onboarding `buildWorkspace`, guest import
parsing, and all screens.

### Placeholder and unfinished work

No `TODO`/`FIXME`/`not implemented` markers (the matches are the task status
value `todo`). Unfinished work is structural instead: the missing routes
above, the unreachable profile folder, and 15 Labs prototypes (~5,000 LOC)
that are deliberately hidden at `/labs` until they graduate.

## Roadmap to 80,000–100,000 LOC (re-estimated)

Planning estimates of *new* production LOC, following the playbook's delivery
order. They are not quotas. Several workstreams start by graduating code that
already exists, which ships features without adding many lines — that is the
right trade, and the estimates only count genuinely new code.

| # | Workstream | New LOC (est.) | Main deliverables |
| --- | --- | ---: | --- |
| A | Accounts + sync | 10,000–14,000 | Per-account workspaces, server sync with offline queue and conflict handling, partner invites on the server, password reset, account export and deletion |
| B | Vendors + Vision | 6,000–9,000 | One vendor model; graduate the vendor manager onto `/vendors`; quotes, payments, appointments; style studio onto `/vision` |
| C | Planning + finance | 6,000–8,000 | Multiple events, task dependencies, reusable templates, planned-vs-actual reports |
| D | Guests + events | 6,000–8,000 | Graduate seating, meals and RSVP; server-side RSVP replies; per-event guest lists |
| F | Integrations + notifications | 5,000–7,000 | Server push and email, calendar export, file storage for contracts and photos |
| — | Platform services | 3,000–5,000 | Authorization policies, audit log, feature flags, error reporting |
| E | Web / vendor workspace | decision | Only if product strategy supports it (playbook §6E) |
| | **Total** | **36,000–51,000** | Lands at roughly **69,000–84,000** |

Even fully delivered, this list reaches the low end of 80–100k. Reaching the
top of the range would need workstream E or new product scope, and that is a
product decision rather than an engineering one. Recount at each milestone
(M2–M5) and adjust; do not pad to close a gap.

## Proposed first vertical slice (M2)

**Vendors, consolidated** (workstream B). Reasons: it removes the biggest
duplication, gives the 5,075-line profile booking UI and the Labs vendor
manager a real home on routes that are already declared, and needs no new
server or threat model. Accounts + sync (A) is first in the delivery order,
but the playbook requires a reviewed threat model and API contract before
implementation; drafting those can run in parallel as M1.

Acceptance criteria to agree before starting:

- One vendor model and one persisted store; the other implementation is
  migrated or deleted, with existing Labs data preserved or explicitly
  dropped.
- `/vendors` lists vendors with filter and search; `/vendors/[id]` shows
  status, contact details, quote, deposit and balance; add and edit work.
- Reachable from the app (Home or Planning), not only from `/labs`.
- `vendorStore` is in the hydration gate; loading, empty and error states
  are handled.
- Store and model tests; Jest, lint and a web bundle pass; checked in Expo
  on a device.
