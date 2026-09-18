# AGENTS.md — Mahal (mahal-v1) handoff notes

This file is for any AI coding agent (opencode, Claude, etc.) picking up
work on this repo. It's a snapshot as of **2026-09-15**, written by Claude
mid-session, handing off active work on new admin features. Read this
before touching APEX or the Oracle schema — a lot of hard-won context
lives here that isn't obvious from the code alone.

For infra setup/day-to-day ops (starting things, credentials, known
gotchas with Windows/cmd.exe/Task Scheduler), see
**`backend/oracle/RUNBOOK.md`** — this file assumes that's already read
and focuses on the *application* work instead.

## What this project actually is

A training exercise: build "a simple page, hosted locally, connected to a
basic table" using React/Node + an Oracle APEX admin backend, as a
learning deliverable (see `N:\mahal\training demo.txt` and
`N:\mahal\docs\mahal_training_plan v2.html` for the original brief — note
the dev-plan module list there, including "booking/records", "approvals",
"reporting", is explicitly flagged in that doc as **a generic placeholder
since Mahal's real feature scope wasn't specified** — don't treat its
exact wording as a spec).

`mahal.city` (WordPress) is a separate, already-live real site whose data
this training DB roughly mirrors. This repo (`mahal-v1`) does not deploy
to or affect that site.

## Architecture (all confirmed working, 2026-09-15)

- **Oracle AI Database 26ai Free**, native Windows install, NOT Docker.
  Listener port **1522** (not 1521). PDB `freepdb1`.
- **ORDS** exposes the `MAHALDB` schema as REST (`/ords/mahaldb/...`) and
  hosts APEX (`/ords/apex`).
- **Node backend** (`backend/`) talks to Oracle *only* through ORDS's
  AutoREST JSON endpoints (`backend/src/stores/oracleStore.js`) — no
  native Oracle driver, no direct SQL from Node.
- **React frontend** (`frontend/`, Vite) — the public-facing site,
  proxies `/api` to the backend.
- **APEX app "Mahal Admin" is Application 100** (not 102 — the original
  102 was lost with no backup and rebuilt from scratch on 2026-09-14; see
  RUNBOOK §6.5 for the export/backup habit now in place. **Always export
  App 100 to `backend/oracle/f100.sql` and commit it after any meaningful
  APEX change** — this is not optional, it's the only recovery path.)

**All three local services (ORDS :8080, backend :4000, frontend :5173)
now run as self-healing Windows Scheduled Tasks** (`Mahal ORDS Server`,
`Mahal Backend Server`, `Mahal Frontend Server` — installed via
`backend/oracle/install-{ords,backend,frontend}-service.ps1`). No manual
terminal windows are needed for local dev anymore. If any of them seem
down, check `schtasks /Query /TN "<name>" /V /FO LIST` and
`netstat -ano | findstr :<port>` before assuming code is broken — a
"connection refused"-looking symptom has twice this project turned out to
be an infra issue (a paused/stuck process), not an app bug.

## Database schema (MAHALDB, see `backend/oracle/provision_mahaldb.sql`)

`cities`, `categories`, `venues` (FK city_id/category_id), `app_users`
(role: client/owner/admin), `inquiries` (a lead/contact-form submission,
`status` default `'new'`, denormalized `venue_name` stored directly),
`bookings` (FK venue_id → venues, guest_id → app_users; `status` default
`'pending'`; **no denormalized venue/guest name columns** — display needs
a join or an LOV), `payments` (FK booking_id → bookings, not used by any
UI yet), `reviews` (FK venue_id, user_id; drives `venues.rating` /
`reviews_count` via a compound trigger).

**Important:** `bookings` and `payments` have existed in the schema since
the start but had **zero UI** (no APEX page, no Node route, nothing in
the frontend) until the work described below began.

## APEX Application 100 — current pages (as of 2026-09-15)

| Page | Type | Table | Notes |
|---|---|---|---|
| Venues | Interactive Report + Form | `venues` | Original wizard build |
| Manage Inquiries | Classic Report | `inquiries` | Rebuilt from Interactive Grid to Classic Report 2026-09-18 (the IG had an undocumented engine bug: every row's Approve/Reject link rendered the identical href regardless of which row was clicked — confirmed via raw HTML inspection, not a data or syntax issue). **Real, tested Approve/Reject workflow — see Part 2 below.** |
| Reviews | Interactive Grid | `reviews` | Rebuilt 2026-09-15 after a wizard bug (ID column wrongly got a venue-name LOV meant for VENUE_ID — deleting/recreating the region fixed it; a column-type edit alone did NOT fix it). **Not independently re-confirmed fixed after rebuild — worth a quick Run-and-check if you're in there anyway.** |
| Analytics | 4 separate Chart regions | `inquiries`, `bookings`, `venues` | Rebuilt 2026-09-18 into 4 independent sibling Chart regions (each with its own Series/Axes — NOT multiple Series stacked in one region, which was tried first and produced a garbled combined chart): Inquiries by Status, Bookings by Status, Top Venues, Revenue Trend. **Part 3 done** — SQL in the Part 3 section below.
| **BOOKINGS** (Page 7) | Interactive Report | `bookings` | Wizard build. Form LOVs are done (see Page 9); IR still shows raw `VENUE_ID`/`GUEST_ID` codes — optional joined query in the checklist below |
| **Booking** (Page 9) | Form | `bookings` | The wizard's paired form page (confirmed to exist). LOVs **already configured**: VENUE_ID → `venues`, GUEST_ID → `app_users`, STATUS → static. **One inconsistency:** STATUS LOV returns **uppercase** `PENDING/CONFIRMED/CANCELLED` while the column default + approval package use lowercase — fix in checklist |

## Active work: 3-part feature request from Gamal (2026-09-15)

Gamal asked to build, in this order, with these decisions already made:

1. **Booking / records management** — a real admin page for `bookings`.
2. **Approval workflows** — approving an inquiry in Manage Inquiries
   should **auto-create a `bookings` row** (status `pending`) from it;
   rejecting should just close the inquiry out. This is the deliberate
   choice (not two independent, unlinked features) — it's also what the
   training plan's "public booking → admin approval" item was getting at.
3. **Admin reporting & dashboards** — expand past the single Analytics
   bar chart into a real multi-widget dashboard: bookings by status, a
   revenue/value trend, inquiries by status, top venues by
   bookings/rating. Build this last, once bookings/approvals exist and
   there's real data to report on.

### Where part 1 (Bookings pages) actually stands right now

**DONE (confirmed in the live app, 2026-09-15):**

- Page 7 "BOOKINGS" — Interactive Report over `bookings` (region source is
  a dynamic query). Confirmed created.
- Page 9 "Booking" — the wizard's paired **Form** page (Normal page, not
  modal). Also confirmed created. Its LOVs are all **already configured**:
  - `P9_VENUE_ID` → Select List, LOV `SELECT name AS display_value,
    id AS return_value FROM venues ORDER BY name`.
  - `P9_GUEST_ID` → Select List, LOV over `app_users` (name + email display).
  - `P9_STATUS` → Select List, static LOV `Pending;PENDING,
    Confirmed;CONFIRMED,Cancelled;CANCELLED`.
  (AGENTS.md previously flagged these as "still needs fixing" — that note
  was written before the wizard page/LOV work was finished. Nothing to fix
  here except the STATUS case, below.)

**Still open (low priority unless in App Builder anyway):**

- Page 7 still shows raw `VENUE_ID`/`GUEST_ID` values (e.g. `v001`).
  Optional joined SQL is in the checklist below; leaving the IR raw is fine.
- **STATUS value-case inconsistency worth fixing:** the Page 9 static LOV
  returns uppercase (`PENDING/...`) but the column `DEFAULT 'pending'` and
  the approval package both write lowercase. Before Part 3 (grouping
  charts), pick one case or each status splits into two buckets. Exact fix
  is a two-minute App Builder edit (checklist item 1).

### Part 2 (Approval workflow) — DONE (2026-09-18), built differently than planned above

**What's actually live on Page 4 is inline PL/SQL in two Before-Header page
processes, NOT a call to the `MAHAL_BOOKING_APPROVAL` package below.**
`backend/oracle/07_booking_approval.sql` was written and DB-tested
(12/12 assertions) on 2026-09-15 but was never wired into the app — Page 4
was rebuilt directly with its own logic instead. The package is still
installed in the schema (harmless, unused) and has real value the inline
version lacks (see "left on the table" below) — a good candidate to adopt
later rather than something to delete.

**Actual implementation (Page 4 "Manage Inquiries", Classic Report,
`#ID#`-based Link columns "Approve"/"Reject", each setting
`P4_INQUIRY_ID` + `REQUEST`):**

- **Approve** (Before Header, condition `REQUEST = 'APPROVE'`): errors if
  the inquiry has no `venue_id`; errors if `status = 'approved'` already
  (re-approve guard); otherwise inserts a `bookings` row (`status
  'pending'`, id `'bk' || SYSTIMESTAMP`) copying `venue_id`/`user_id`/
  `event_date`/`guests`, then sets the inquiry `status = 'approved'`.
- **Reject** (Before Header, condition `REQUEST = 'REJECT'`): unconditionally
  sets `status = 'rejected'` — **no guard, by explicit product decision**
  (Gamal: "Reject can still override an approval"). Rejecting an
  already-approved inquiry does NOT touch its booking row, which is left
  orphaned (still `pending`) — a known, accepted trade-off, not a bug. A
  future "cancel booking" action was suggested to reconcile this properly
  but is not built.

**Left on the table by not using the package** (worth revisiting): guest
resolution by email when `user_id` is NULL, `total_price` estimation from
`venues.price_from`. The inline version leaves `guest_id`/`user_id` as
whatever the inquiry already had and never sets `total_price` on approval.

**Why the plan changed from the checklist below:** the IG-based wiring
sketched in checklist item 2 (row-link setting a hidden item, IG Link
column) hit a genuine Interactive Grid engine bug in this APEX build —
every row's link rendered the same href no matter which row was clicked,
confirmed via HTML inspection, ruled out as a data/syntax issue. Fix was
converting the whole region to a Classic Report with `#ID#`-substitution
Link columns, which works correctly per-row. The `mahal_booking_approval.*`
package calls in the checklist's sample process were never actually
written into Page 4 for the same reason the wiring approach changed —
inline logic was simpler to debug against the Classic Report rebuild in
the same sitting. Status vocabulary matches what was already decided:
`approved` / `rejected`.

### Part 3 (Reporting dashboard) — DONE (2026-09-18)

Page 6 "Analytics" rebuilt as 4 independent sibling Chart regions (a
region dropped inside an existing chart becomes a new Series on a shared
axis, not a separate chart — hit this mistake once, fixed by deleting the
extra Series nodes and dragging fresh Chart regions onto empty canvas):

- **Inquiries by Status**: `SELECT INITCAP(status) AS status_label,
  COUNT(*) AS cnt FROM inquiries GROUP BY INITCAP(status) ORDER BY cnt DESC`
- **Bookings by Status**: same shape over `bookings`.
- **Top Venues**: `SELECT v.name, COUNT(b.id) FROM bookings b JOIN venues v
  ON v.id = b.venue_id GROUP BY v.name ORDER BY COUNT(b.id) DESC FETCH
  FIRST 10 ROWS ONLY`.
- **Revenue Trend**: `SELECT TO_CHAR(TRUNC(created_at,'MM'),'YYYY-MM'),
  SUM(total_price) FROM bookings WHERE UPPER(status) = 'CONFIRMED' GROUP BY
  TRUNC(created_at,'MM') ORDER BY TRUNC(created_at,'MM')` — uses
  `created_at` (a real TIMESTAMP), not `event_date` (VARCHAR2 with
  genuinely inconsistent formats in real data, e.g. `15/5/2027` vs
  `2027-02-04` — don't parse it for trends).

`INITCAP`/`UPPER` normalization is there because `STATUS` values are
stored with inconsistent casing across rows (`CONFIRMED` vs `pending`) —
this is the same root cause as checklist item 1 below (Page 9's STATUS LOV
still writes uppercase while the approval process writes lowercase); the
dashboard queries work around it rather than fixing the source.

### App Builder checklist — next human session (APEX work can't be scripted)

APEX accounts hard-lock on automated logins, so the remaining work is a
human-in-App-Builder session. DB-side prep is already done.

1. **Fix the STATUS case inconsistency (Page 9, `P9_STATUS`).** Change the
   static LOV to lowercase return values so they match the column default
   and the approval package:
   `STATIC:Pending;pending,Confirmed;confirmed,Cancelled;cancelled`
   No data migration needed — `bookings` is empty. (Skip = every status
   shows as two buckets in the Part 3 dashboard.)
2. ~~Wire Approve/Reject into Manage Inquiries (Page 4).~~ **DONE
   2026-09-18** — built differently than sketched here (Classic Report +
   inline PL/SQL, not IG + package call). See Part 2 above for what's
   actually live and why the approach changed.
3. **(Optional) friendlier Page 7 report.** Replace the region source with
   a join so admins see names, not codes:
   ```
   SELECT b.id, v.name AS venue, u.name AS guest, u.email AS guest_email,
          b.event_date, b.guest_count, b.status, b.total_price, b.created_at
   FROM bookings b
   LEFT JOIN venues v    ON v.id = b.venue_id
   LEFT JOIN app_users u ON u.id = b.guest_id
   ORDER BY b.created_at DESC
   ```
4. **Sanity-check Page 5 (Reviews)** while in there — the region rebuild
   was never independently re-confirmed.
5. ~~Re-export f100.sql.~~ **DONE 2026-09-18** — re-exported (Standard
   Export, SQL format) after the Page 4 rebuild and the Page 6 dashboard
   work, replacing the 2026-09-15 export which predated both.

## Gotchas specific to this app (beyond RUNBOOK's infra ones)

- **Never attempt automated/scripted APEX logins** (browser automation,
  scripted form fills). This account has repeatedly hard-locked
  ("The account is locked.") after just 1-2 automated attempts — it does
  NOT self-clear on a correct password afterward and needs a SQL-level
  unlock (`backend/oracle/06_unlock_apex_admin.sql`, run as SYS AS
  SYSDBA). Always have a human log into APEX manually.
- **A wizard-built Interactive Grid/Report region can end up with wrong
  internal LOV/column metadata that a simple field-level edit won't
  fix** — if a column's `Type` looks right but you still get a data-type
  error (e.g. `ORA-01722` trying to convert a string), the fix that
  actually worked before was deleting the region and recreating it fresh
  against the table, not patching individual column properties.
- When an Oracle/APEX built-in package's exact parameter name or valid
  values are uncertain, don't guess — query `ALL_ARGUMENTS` (resolving
  synonyms via `ALL_SYNONYMS` first) and grep `ALL_SOURCE` for the real
  signature/examples. This found real, non-obvious answers twice already
  (`APEX_UTIL.EDIT_USER`'s exact parameter names and `p_developer_roles`
  format).
- `N:` on this machine ("nora") is a genuine local Fixed Drive, not a
  network mapping or `subst` — confirmed via `fsutil fsinfo drivetype N:`
  (`net use` and `subst` both came back empty, which is *not* proof a
  drive doesn't exist — it just means it isn't a mapping).

## Repo / credentials pointers (see RUNBOOK.md and `CREDENTIALS.local.md` for full detail)

- GitHub: `norarassem-ux/mahall-dev.git`, branch `main`. Latest commit as
  of this note: `462dfdd`.
- APEX workspace `MAHALDB`, user `ADMIN`, password `NRassem@30`.
- DB schema `mahaldb` / `MpPtMXWYRPhnXk3#` — **`CREDENTIALS.local.md`
  got recreated at its canonical (gitignored) spot
  `backend/oracle/CREDENTIALS.local.md` on 2026-09-15.** The previous copy
  lived only in `N:\mahal\backup\...` and was stale (passwords no longer
  matched); the schema password was realigned back to the documented value
  the same session. If sqlplus ever rejects that login again, don't
  assume the doc is right — realign the DB to the doc (or the doc to the
  DB) and note it here.
- `backend/oracle/*.sql` — provisioning/fix scripts, all idempotent-ish
  and safe to re-run. `07_booking_approval.sql` post-dates them (creates
  the `MAHAL_BOOKING_APPROVAL` package, 2026-09-15).
- `backend/oracle/install-{ords,backend,frontend}-service.ps1` — the
  permanent-service scripts. If you ever need to touch their Scheduled
  Task XML again: **`&` must be escaped as `&amp;` in the `<Arguments>`
  element** — hit and fixed this bug twice already (`schtasks` rejects
  the whole file with "The task XML is malformed" otherwise).

## Where fuller history lives

Gamal also uses Claude with a persistent memory/project-notes file
tracking this project's full history in much more detail (infra
incidents, exact dates, root-cause writeups). If you're a different agent
and don't have access to that, this file plus RUNBOOK.md plus the git log
should be enough context to continue safely — just don't assume you know
*why* a past decision was made if it isn't written down here or in
RUNBOOK.md; ask Gamal rather than re-deciding it.
