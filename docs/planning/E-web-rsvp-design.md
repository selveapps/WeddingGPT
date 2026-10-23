# E — Web: RSVP site, wedding website and desktop layouts

**Status: approved 23 October 2026, with every recommendation in
[Decisions](#decisions) accepted.** Workstream E in the playbook (§6E) is
"only if product strategy supports it"; the team decided to pursue it as part
of reaching 80,000–100,000 production LOC. The vendor portal (E4) stays
undecided until E1–E3 ship.

## 1. What "web" means for WeddingGPT

The couple's app already runs in a browser: the Expo web build (`npm run web`,
`expo export --platform web`) is the same app. A second couple-facing web app
would duplicate it, so it is **not** part of this workstream.

The web work that is genuinely new is everything a browser is better at, or
that people without the app need:

| Slice | For | What it is |
| --- | --- | --- |
| E1 RSVP site | Guests | A guest opens the link on their invitation and replies for their household: attending or not, meal, dietary needs, plus-one name. No app, no account. |
| E2 Wedding website | Guests | A public page per wedding: date, places, schedule, travel and stay, registry links, FAQ. Optional password. |
| E3 Desktop layouts | Couples | In the existing Expo web build: wide-screen guest list table with bulk edits, CSV import and export, and a seating chart that uses the space. |
| E4 Vendor portal | Vendors | Vendors receive enquiries and send quotes straight into a couple's vendor list. **Separate decision (D11)**: it needs vendor accounts, a new role and moderation. |

### Revised estimate

The previous estimate (15,000–20,000 new LOC for "a web app") assumed a
separate couple web app. Without it:

| Slice | New LOC (est.) |
| --- | ---: |
| E1 RSVP site (server, pages, app side) | 3,500–5,000 |
| E2 Wedding website (server, pages, app editor) | 3,000–4,500 |
| E3 Desktop layouts | 2,500–4,000 |
| **E1–E3** | **9,000–13,500** |
| E4 Vendor portal (if approved) | 6,000–9,000 |
| **E1–E4** | **15,000–22,500** |

With the other workstreams (66,000–80,000), E1–E3 lands at about
**75,000–93,000**, and E1–E4 at about **81,000–102,000**.

## 2. Architecture

- **One server.** RSVP and website pages are served by the existing API
  server (`server/auth`, which A1–A2 turned into the WeddingGPT API), under
  `/r/...` and `/w/...`. They read the workspace records that sync (A2)
  already stores, so there is no second copy of the guest list.
- **Server-rendered HTML, no client framework.** Guests open these pages once,
  often on a weak connection, from a printed invitation. Plain HTML forms load
  instantly, work without JavaScript and are easy to make accessible. Pages
  are rendered from small template functions that escape every value by
  default (§5, W3).
- **Guest replies do not edit guest records directly.** A reply is stored as
  a new record in a server-written collection, `rsvpResponses`. The couple's
  app applies responses to guests when it syncs, and shows what changed. This
  means a guest can never overwrite the couple's own edits, and the couple
  always sees who replied what.
- **Depends on sync.** The server only knows the guest list once the couple's
  app syncs it, so E1 and E2 follow A4 (the sync engine). E3 has no server
  dependency and can start at any time.

## 3. E1 — RSVP site

### Invitations

The couple creates RSVP links in the app (per household, or per guest without
one). Each invite has two ways in:

1. **A link** with a 128-bit random token: `https://<host>/r/<token>`. This
   is what goes in a message or a QR code on the invitation.
2. **A short code** for typing from paper: the wedding's page address plus an
   8-character code from a 31-letter alphabet without look-alikes (about 40
   bits): `https://<host>/w/priya-and-sam` → "Enter your code". The code only
   works on its own wedding's page, and attempts are rate limited.

Both are random, stored only as hashes, can be revoked and reissued, and stop
working after the RSVP deadline plus 30 days.

The Labs prototype's codes (six characters derived from the record id) are
not used: they are not secret, and across the whole platform a random guess
would match some household far too often (§5, W1).

### Data model (server)

```text
rsvp_invites   id, workspace_id, target_type ('household' | 'guest'),
               target_id, token_hash, code_hash, created_at, revoked_at,
               expires_at, last_opened_at, responded_at
rsvp_settings  workspace_id, deadline (date), questions (JSON: meals on/off,
               dietary on/off, plus-one names on/off, message to the couple),
               slug, updated_at
```

Responses are written as sync records in collection `rsvpResponses`:
`{ id, inviteId, guests: [{ guestId, attending, meal, dietary, plusOneName }],
message, submittedAt }`. A household may submit again before the deadline;
the newest response wins in the app.

### What a guest sees

1. Couple's names, date and place (from the wedding record), and the
   deadline.
2. Their household's guests by **first name only**, each with attending /
   not attending, then meal and dietary questions if the couple turned them
   on, then a plus-one name where allowed.
3. Optional message to the couple. Submit → confirmation page with what they
   said, and a link to change it until the deadline.

Nothing else from the guest list is shown or reachable.

### API (couple side, authenticated, membership-checked like A1)

| Method and path | Body | Success |
| --- | --- | --- |
| `PUT /v1/workspaces/:id/rsvp/settings` | `{ deadline, questions, slug }` | 200; 409 `slug_taken` |
| `POST /v1/workspaces/:id/rsvp/invites` | `{ targets: [{ type, id }] }` | 201 `{ invites: [{ targetId, url, code }] }` — the only time the token and code are shown |
| `POST /v1/workspaces/:id/rsvp/invites/:inviteId/revoke` | — | 204 |
| `GET /v1/workspaces/:id/rsvp/invites` | — | 200 `{ invites: [{ id, targetId, openedAt, respondedAt, revoked }] }` |

### Pages (public)

| Path | Purpose |
| --- | --- |
| `GET /r/:token` | RSVP form for that invite |
| `POST /r/:token` | Submit; validates every field against the invite's own guests |
| `GET /w/:slug/rsvp` and `POST` | Enter a short code, then redirect to the invite's form |

## 4. E2 — Wedding website and E3 — desktop layouts

**E2.** The couple edits the site in the app; its content is a sync record
(`website` collection, one per workspace): sections for welcome text,
schedule, places with map links, travel and stay, registry links and FAQ, and
a visibility setting (off, public, password). The server renders
`/w/:slug`. Published pages carry `noindex` unless the couple opts in to
search engines (D9). Guest names never appear on the website.

**E3.** Wide-screen layouts inside the existing Expo web build, switched on
by window width rather than platform so a tablet benefits too: guest list as a
sortable table with multi-select and bulk RSVP, invitation and tag edits; CSV
import with column mapping and a preview, and CSV export for the caterer;
seating chart (once graduated from Labs) with tables laid out in a grid.

## 5. Threat model (public surfaces)

**New actors:** anyone on the internet with or without an invite link;
automated scrapers and form spammers; a guest who forwards their link.

**Assets:** guest names, dietary and accessibility information (can reveal
health), attendance, the couple's message box, wedding date and location
(which also says when a home may be empty).

| # | Threat | Mitigation | Test |
| --- | --- | --- | --- |
| W1 | **Guessing invite codes** to read households or change replies | Link tokens are 128-bit random; short codes are 40-bit random, only valid on their own wedding's page; 10 code attempts per IP per hour and 50 per wedding per hour; stored hashed | Random tokens and codes fail; the limit trips; a valid code for wedding A fails on wedding B |
| W2 | A link reveals more than its household | The page loads only the invite's target guests, by first name; the form accepts only those guest ids | Posting another household's guest id is rejected and changes nothing |
| W3 | **Stored XSS**: couple- or guest-entered text rendered as HTML (names, FAQ, messages) | One template function escapes every interpolated value; no raw HTML from users; Content-Security-Policy with no inline script | Names and FAQ text containing `<script>` and `"onerror=` render as text |
| W4 | Form spam and abuse | Rate limits per IP and per invite; message length limit; responses only while the invite is valid | Over-limit and expired submissions rejected |
| W5 | Cross-site request forgery on RSVP forms | The form is authorised by the token in the URL, not a cookie, so a forged request needs the token anyway; `SameSite` is irrelevant | — (documented) |
| W6 | Clickjacking and content sniffing | `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` (tokens in URLs must not leak via Referer) | Headers present on every page |
| W7 | Wedding website indexed or scraped, exposing date and place | `noindex` by default; optional password; no guest names on the site | Header and meta present; password wall works |
| W8 | Slug squatting or impersonation (`/w/priya-and-sam` taken by someone else) | Slugs are first-come per workspace, reserved words blocked, changeable; the page never shows account emails | Duplicate and reserved slugs rejected |
| W9 | Forwarded link used by someone else | Accepted risk: the link speaks for its household, as a paper reply card would. The couple sees when it was opened and can revoke and reissue | Revoked link shows "This link is no longer active" |
| W10 | A guest overwrites the couple's data | Responses are a separate collection; the app applies them; guest records are never written by the public server | Submitting a response leaves the `guests` records unchanged |

## 6. Delivery order

| Order | Slice | Depends on |
| --- | --- | --- |
| 1 | E3 desktop layouts | Nothing — can start now |
| 2 | E1a RSVP server: invites, settings, pages, W1–W6/W10 tests | A2 merged, A4 (app syncs guests) |
| 3 | E1b RSVP in the app: create links, share sheet and QR, apply responses | E1a |
| 4 | E2 wedding website | E1a (shared page rendering and slug) |
| 5 | E4 vendor portal | D11 |

## Decisions

All five were approved as recommended.

| # | Decision | Approved |
| --- | --- | --- |
| D7 | Domain for public pages | A dedicated domain (e.g. `rsvp.weddinggpt.app`), separate from the API, so cookies and CSP never mix |
| D8 | What guests may answer | Attending per guest, meal and dietary (each switchable by the couple), plus-one name, message. No song requests or extras in the first version |
| D9 | Search engine indexing of wedding websites | Off by default; the couple can turn it on |
| D10 | Can guests change a reply after submitting | Yes, until the RSVP deadline |
| D11 | Build the vendor portal (E4) | Decide after E1–E3 ship; it is the largest and least certain slice |

## Implementation notes

- **E1a (RSVP server).** Pages live in `server/auth/rsvp`: an escaping `html`
  template (`html.mjs`), page renderers, the repository and the routes. Guest
  pages skip the app-token check (browsers never carry it) and nothing else.
  Replies are sync records in `rsvpResponses`, which the sync layer refuses
  from devices (`read_only`), so only a guest's own link can write one. A
  household may reply again until the deadline; the newest reply replaces the
  previous one. Links stop working 30 days after the deadline, or a year after
  they were made when there is no deadline. Short codes are 8 characters
  (about 40 bits) and are looked up only within their own wedding. Each public
  page threat has a test, and removing escaping, the guest filter, the
  server-only rule or the browser exemption each makes tests fail.
- **E1b (RSVP in the app).** Guests > RSVP website, available once the
  wedding is synced: the page address (suggested from the couple's names),
  a reply-by date, which questions to ask, a link and code per household (or
  guest without one), sharing, and a CSV of codes for printing. The server
  returns a link once and keeps only its hash, so links are kept on the phone
  that made them; another phone sees "link made on another phone" and can
  issue a new one. Replies sync down as a read-only slice and are applied to
  the guest list once per submission, after the pull that brought them, so the
  guest edits reach the partner; conflicts where both phones made the same
  change are no longer reported. The Labs RSVP-codes prototype is removed. The
  live integration test covers the round trip: link, guest form post, sync,
  guest list updated.
- **E2 (wedding website).** Content is a synced `website` record edited in
  Guests > Wedding website: welcome, schedule (with map directions), getting
  there and places to stay, registry links and FAQ. Visibility (off, public,
  password), the password and search indexing are server settings set through
  the API, so syncing can never publish or unlock a site. The site uses the
  RSVP page address (`/w/<slug>`, RSVP at `/w/<slug>/rsvp`). A correct password
  sets an HttpOnly, SameSite=Lax cookie for that path only, signed with a
  per-database secret and tied to the password hash, so changing the password
  signs every visitor out. Only http(s) links are rendered, and a
  password-protected site is never indexed. Couples can write before the
  wedding is synced; publishing waits for sync.
