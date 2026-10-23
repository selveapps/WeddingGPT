# M1 — Accounts and sync: design, API contract and threat model

**Status: approved 23 October 2026, with every recommendation in
[Decisions](#decisions) accepted.** Playbook §6A and §9: accounts and sync are
built only after the threat model and API contracts are reviewed. Slices are
implemented in order from A1.

## 1. Goal

A couple signs in on two phones and sees one wedding. Changes made offline on
either phone reach the other when it reconnects, without losing either
person's edits silently. A person can export or delete their data.

### In scope

- Workspaces (one per wedding) and memberships (owner, partner).
- Partner invites by link.
- Server sync of the workspace, with an offline outbox on the device.
- Deletions that sync (tombstones).
- Password change, password reset by email, sign out everywhere.
- Account export and account deletion.

### Out of scope (later workstreams)

- Planner / vendor roles and per-section permissions (Platform services).
- Real-time push of changes (the first version syncs on open, on change and
  every few minutes).
- Shared photo and file storage (Integrations workstream).
- A web client.

## 2. What exists today

| Piece | Where | State |
| --- | --- | --- |
| Accounts, sessions | `server/auth` (SQLite, scrypt, hashed tokens) | Shipped, tested |
| App sign-in, secure token storage | `services/auth`, `store/authStore` | Shipped, optional |
| Sync fields on every entity | `models/base.js`: `version`, `updatedAt`, `syncStatus` | Written on every change, never used |
| Merge rule (last write wins per record) | `labs/sync/model.js` | Tested; no tombstones |
| Couple model with `partnerUserId`, `collaborationEnabled` | `models/wedding.js` | Fields exist, unused |
| Workspace data | 7 persisted zustand stores, one global set per device | Not partitioned by account |

## 3. Data model (server)

All tables live in the existing `server/auth` SQLite database, which becomes
the WeddingGPT API server. Every row that holds wedding data carries a
`workspace_id`; nothing is readable without a membership of that workspace.

```text
users            (exists) id, email, name, password_hash, created_at, updated_at,
                 + password_changed_at, deleted_at
sessions         (exists) token_hash, user_id, created_at, expires_at, last_used_at
workspaces       id, name, created_by, created_at, deleted_at
memberships      workspace_id, user_id, role ('owner' | 'partner'), created_at
                 PRIMARY KEY (workspace_id, user_id)
invites          token_hash, workspace_id, created_by, role, expires_at,
                 accepted_by, accepted_at, revoked_at
records          workspace_id, collection, id, data (JSON), version,
                 updated_at, updated_by, deleted_at, seq
                 PRIMARY KEY (workspace_id, collection, id)
                 seq = server-wide increasing counter, assigned on every write
mutations        workspace_id, mutation_id, applied_at  -- idempotency
reset_tokens     token_hash, user_id, expires_at, used_at
audit_log        id, workspace_id, user_id, action, target, at  -- no record contents
```

`collection` is an allow-list matching the stores: `wedding`, `budget`,
`tasks`, `taskCategories`, `expenses`, `budgetCategories`, `guests`,
`households`, `vendors`, `notificationPreferences`. Unknown collections are
rejected.

## 4. Sync protocol

### Rules

1. **Each record syncs on its own.** The unit of conflict is one record
   (one task, one guest), not the whole workspace.
2. **The server orders writes.** Every accepted write gets the next `seq`.
   Clients pull "everything after the last `seq` I saw". Device clocks are
   never trusted for ordering.
3. **Optimistic concurrency.** A push carries the `version` the device last
   saw for that record (`baseVersion`). If the server's version is the same,
   the write is accepted and the version goes up by one. If not, the record
   was changed elsewhere first.
4. **Conflicts: last push wins, and the loser is kept.** The server accepts
   the later push (it is the person's most recent intent) but returns the
   overwritten copy in `conflicts`. The app shows "Sam also changed this
   task" with an option to restore the other version. This keeps the merge
   simple while never losing an edit silently. *(Open decision D3.)*
5. **Deletes are tombstones.** A delete sets `deleted_at` and bumps the
   version; the row stays so other devices learn about it. Tombstones older
   than 90 days are purged once every member has synced past them.
6. **Idempotent pushes.** Every change in the outbox has a `mutationId`; the
   server ignores a mutation it has already applied, so retries after a
   dropped connection are safe.

### Device side

- **Outbox.** Each local write to a synced store appends
  `{ mutationId, collection, id, op, baseVersion, data }` to a persisted
  outbox and marks the entity `syncStatus: pending_sync`. Several writes to
  the same record before a push collapse into one.
- **Sync loop.** On app open, after a local change (debounced 2 s), and every
  5 minutes while open: push the outbox in batches of 100, then pull since
  the saved cursor until `hasMore` is false.
- **Applying pulls.** A pulled record replaces the local one unless the local
  one has an un-pushed change; then the outbox wins and the next push decides.
- **Partitioning.** Store data moves under a workspace key
  (`ws:<workspaceId>:<store>`). Signed out, the app uses a `local` workspace,
  which is today's behaviour.
- **First sign-in.** If the device has a local wedding and the account has no
  workspace, the local wedding is uploaded as a new workspace. If the account
  already has one, the person chooses which to keep. *(Open decision D2.)*

## 5. API contract

All endpoints are JSON over HTTPS, under `/v1`, and take
`Authorization: Bearer <token>` except where noted. Errors are
`{ "error": "<code>" }` with these statuses: 400 `invalid` (plus `fields`),
401 `unauthorised`, 403 `forbidden`, 404 `not_found`, 409 `conflict`,
413 `too_large`, 429 `rate_limited`, 500 `internal`.

**Authorization rule for every `/v1/workspaces/:id/...` route:** the caller
must have a membership of `:id`. A missing membership returns **404**, not
403, so workspace ids cannot be probed.

### Accounts (extends the existing `/v1/auth`)

| Method and path | Body | Success |
| --- | --- | --- |
| `POST /v1/auth/password` | `{ currentPassword, newPassword }` | 204; every other session is revoked |
| `POST /v1/auth/reset/request` *(no auth)* | `{ email }` | 202 always, whether or not the email exists |
| `POST /v1/auth/reset/confirm` *(no auth)* | `{ token, newPassword }` | 204; all sessions revoked |
| `POST /v1/auth/logout-all` | — | 204 |
| `GET /v1/account/export` | — | 200 `{ user, workspaces: [{ workspace, role, records }] }` |
| `DELETE /v1/account` | `{ password }` | 204 (see D4 for owned workspaces) |

### Workspaces and members

| Method and path | Body | Success |
| --- | --- | --- |
| `GET /v1/workspaces` | — | 200 `{ workspaces: [{ id, name, role }] }` |
| `POST /v1/workspaces` | `{ name }` | 201 `{ workspace }`; caller becomes owner |
| `GET /v1/workspaces/:id/members` | — | 200 `{ members: [{ userId, name, role }] }` |
| `DELETE /v1/workspaces/:id/members/:userId` | — | 204; owner removes a partner, or a partner leaves |
| `POST /v1/workspaces/:id/invites` | `{ role: "partner" }` | 201 `{ url, expiresAt }`; owner only |
| `DELETE /v1/workspaces/:id/invites` | — | 204; revokes open invites |
| `POST /v1/invites/accept` | `{ token }` | 200 `{ workspace }`; 404 if expired, used or revoked |

### Sync

`POST /v1/workspaces/:id/sync/push`

```json
{
  "mutations": [
    {
      "mutationId": "mut_01J…",
      "collection": "tasks",
      "id": "task_01J…",
      "op": "upsert",
      "baseVersion": 3,
      "data": { "title": "Book the venue", "status": "done" }
    }
  ]
}
```

Response 200:

```json
{
  "applied": [{ "mutationId": "mut_01J…", "version": 4, "seq": 1882 }],
  "conflicts": [
    { "mutationId": "mut_01J…", "overwritten": { "version": 4, "updatedBy": "user_…", "data": { } } }
  ],
  "rejected": [{ "mutationId": "mut_01J…", "error": "invalid" }]
}
```

`GET /v1/workspaces/:id/sync/pull?since=<seq>&limit=500`

```json
{
  "records": [
    { "collection": "tasks", "id": "task_01J…", "version": 4, "updatedAt": "…", "deletedAt": null, "data": { } }
  ],
  "cursor": 1882,
  "hasMore": false
}
```

Limits: 100 mutations per push, 64 KB per record, 1 MB per request,
500 records per pull.

## 6. Threat model

**Assets:** account credentials and sessions; wedding workspace data,
including guests' names, phone numbers, emails and **dietary and accessibility
notes, which can reveal health information**; budget figures; invite links.

**Actors:** a member (owner or partner); a former partner whose access was
removed; another signed-in user; an unauthenticated internet client; someone
holding a stolen phone; someone holding a copy of the database or a backup.

**Trust boundaries:** phone ↔ API (internet); API ↔ database; API ↔ email
provider; app ↔ AI proxy (workspace context is sent there today).

| # | Threat | Mitigation | Test |
| --- | --- | --- | --- |
| T1 | **Another user reads or writes a workspace by changing its id in the URL** (broken access control) | Membership check in one middleware on every workspace route; every SQL query also filters by `workspace_id`; 404 for non-members | Two users, two workspaces: every route called with the other workspace's id returns 404 and changes nothing |
| T2 | A record pushed with another workspace's record id overwrites it | Primary key includes `workspace_id`; ids are never looked up without it | Push a record id that exists in workspace B into workspace A; B is unchanged |
| T3 | Removed partner keeps access | Membership is checked on every request and never cached in the token, so removal takes effect on the next request without touching the person's sessions | Remove partner, then their next push and pull return 404 |
| T4 | Invite link guessed, reused or forwarded | 256-bit random token, stored hashed, single use, 7-day expiry, revocable; accepting needs a signed-in account; the owner sees who joined | Expired, reused, revoked and random tokens all return 404 |
| T5 | Password guessing | Existing per-IP limit, plus 10 failures per account per hour, then a 15-minute lock; scrypt hashing | Exceed both limits |
| T6 | Account enumeration | Login and reset request answer identically for unknown emails (login already does) | Same status and body for known and unknown email |
| T7 | Reset token abuse | 256-bit, hashed, single use, 30-minute expiry; use revokes all sessions | Reuse and expiry |
| T8 | Stolen session token | Token in Keychain/Keystore; HTTPS only; 30-day expiry; password change and "sign out everywhere" revoke all sessions | Old token after password change returns 401 |
| T9 | Malformed or huge payloads (crash, storage exhaustion) | Body, record and batch limits; collection allow-list; JSON shape check per collection; per-workspace storage quota | Oversized, unknown collection, wrong types |
| T10 | Replay or duplicate pushes | `mutationId` idempotency table | Same push twice applies once |
| T11 | Silent data loss between partners | Conflicts return the overwritten version and the app offers restore (rule 4); tombstones instead of hard deletes | Two devices edit the same task offline, both versions recoverable |
| T12 | Database or backup copied | Passwords and tokens only as hashes; disk encryption on the host; backups encrypted; no record contents in logs or audit log | Grep logs in tests for record fields |
| T13 | Personal data kept after deletion | Account deletion removes the user, sessions, memberships and solely owned workspaces; backups expire within 30 days | Delete account, then export and direct DB queries find nothing |
| T14 | Guest data sent to the AI proxy | Unchanged by this work, but flagged: the assistant context should exclude guest contact and dietary details unless the question needs them | Review before sync ships |

**Security tests are acceptance criteria**, not a follow-up (playbook §1):
each "Test" column entry becomes an automated test in `server/` before the
matching endpoint merges.

## 7. Delivery slices

Each slice is a separate PR with tests, following the feature template.

| Slice | Contents | New LOC (est.) |
| --- | --- | ---: |
| A1 Workspaces | `workspaces`, `memberships`, membership middleware, T1–T3 tests | 1,200–1,600 |
| A2 Sync server | `records`, `mutations`, push and pull, tombstones, limits, T2/T9–T11 tests | 2,000–2,800 |
| A3 Store partitioning | Workspace-scoped storage keys, migration of today's data into `local` | 1,000–1,500 |
| A4 Sync engine (app) | Outbox, sync loop, applying pulls, conflict notices, sync status in Account | 2,500–3,500 |
| A5 Invites | Invite and accept endpoints, share-link screen, deep link, members list | 1,200–1,800 |
| A6 Password and reset | Change password, sign out everywhere, reset by email (needs D5) | 900–1,300 |
| A7 Export and deletion | Export, account deletion, T13 tests | 700–1,000 |
| **Total** | | **9,500–13,500** |

A1 and A2 can start once this document is approved; A6 waits on the email
provider.

## Decisions

All six were approved as recommended.

| # | Decision | Approved |
| --- | --- | --- |
| D1 | Database: keep SQLite or move to Postgres before sync | SQLite on one server with WAL and nightly encrypted backups is enough for launch; keep the SQL portable so moving later is a migration, not a rewrite |
| D2 | First sign-in when both the phone and the account have a wedding | Ask the person which to keep; never merge two weddings automatically |
| D3 | Conflict policy | Last push wins, overwritten version kept and offered for restore (rule 4) |
| D4 | Deleting an account that owns a workspace with a partner | Ownership passes to the partner; a solo workspace is deleted |
| D5 | Email provider for invites and password reset | Any provider with an API and EU/US data residency options; needed only for A6 |
| D6 | Signing out on a shared phone | Keep the synced copy encrypted on the device until the next sign-in, or wipe it; recommend wipe, with a warning if the outbox is not empty |

## Implementation notes

Details settled while building, which refine sections 4 and 5.

- **A1 (workspaces).** The owner cannot leave their own workspace; handing
  it over belongs to account deletion (D4, A7). A user may belong to at most
  10 workspaces; creating an eleventh returns 403 `limit_reached`. A wrong
  HTTP method on a known path returns 405.
- **A2 (sync).** `seq` comes from a dedicated counter, not `MAX(seq) + 1`,
  so purging the newest tombstone can never reissue a seq that devices have
  already pulled past. A tombstone keeps no contents (`data` is null), so a
  deleted guest's contact and dietary details do not stay on the server for
  90 days. Conflicts also return the overwritten copy's `updatedAt` and
  `deletedAt`. A new record beyond the 20,000-record quota is rejected with
  `quota_exceeded`; edits and deletes still apply. Idempotency entries are
  dropped after 30 days. Pull cursors are stored per member, which is what
  the tombstone purge waits on.
- **A3 (storage partitioning).** The `local` workspace keeps the original
  unprefixed keys, so existing data needs no migration; other workspaces use
  `ws:<workspaceId>:<store>`. The active workspace id is saved under
  `workspace:active` and read before any store hydrates. A switch pauses
  writes and empties every registered store before reloading, because
  zustand's `persist` keeps in-memory state when the new key is empty and
  would otherwise copy one wedding into another. A test fails the build if a
  persisted store is not registered. Nothing switches workspaces yet; sign-in
  will, in A4.
- **A4 (sync engine).** Changes are detected by comparing entity
  references between store updates, so no store action changed. Synced:
  wedding, budget, tasks, task and budget categories, expenses, guests,
  households, vendors. Not synced, on purpose: reminder preferences (personal
  to each partner), the user record, onboarding progress, assistant
  conversations, and per-device state such as today's checklist. The engine
  attaches only after hydration and pauses during every workspace switch;
  without those, launch would re-upload the wedding and a switch would push
  deletes for everything. A change queued while an earlier push of the same
  record is in flight is rebased, so it does not conflict with itself. Sync
  runs two seconds after an edit, on sign-in, every five minutes and when the
  app returns to the foreground. Signing out, by any route, leaves the
  workspace (D6), warning first if changes have not synced. An integration
  test runs the real client against the real server in CI, and confirmed the
  fake server used in unit tests follows the same protocol.
- **A5 (invites).** A wedding is two people for now (owner and one partner);
  accepting into a full wedding returns 409 `workspace_full` and does not use
  the invite up. Creating an invite revokes the open one, so there is never
  more than one live link. A member who opens their own link gets the
  workspace back without using it up. The response includes `url`, built from
  `INVITE_URL_BASE` (default `weddinggpt://invite/`), which the app's
  `/invite/[token]` screen handles; a signed-out partner signs in and comes
  straight back. The live integration test covers two accounts sharing one
  wedding end to end, including removal.
- **A7 (export and deletion).** `GET /v1/account/export` returns the account
  and, for every wedding, its members (names and roles) and live records;
  never a password hash, session or invite token, or website password.
  `DELETE /v1/account` needs the password again and shares the per-IP rate
  limit with sign-in, so a stolen session cannot erase an account or guess
  the password. Deletion is one transaction: an owned wedding with a partner
  passes to the longest-standing partner (D4), who becomes `created_by` too;
  an owned solo wedding is deleted, and records, tombstones, mutations,
  cursors, invites, RSVP settings and links and website settings cascade with
  it. In weddings that stay, `records.updated_by` and invite
  `created_by`/`accepted_by` become `deleted`, open invites they sent are
  revoked, and their pull cursors go; then the user row, which removes their
  sessions and memberships. The T13 test scans every column of every table
  for the user's id and email afterwards and finds nothing. Backups are
  outside the server code; they must expire within 30 days.
