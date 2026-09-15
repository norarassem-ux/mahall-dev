# Mahal — Oracle 26ai / ORDS / APEX runbook (native Windows setup)

**Status (2026-09-11):** confirmed working end-to-end, locally, on Gamal's
machine ("nora"): Oracle Database → ORDS → Node backend → React frontend,
plus APEX workspace admin login. This replaces every earlier version of
this runbook, which described a Docker-based setup (`oracle-26ai` /
`ords-26ai` containers) that is no longer what's actually running. Oracle
and ORDS are installed **natively** on Windows, not in Docker.

Nothing outside "nora" itself — not this repo's CI, not a cloud session —
can reach `localhost` on your machine. Every command below is meant to be
run by you, directly on nora, in the terminal windows described in step 4.

## 0. What's installed, and where

- **Oracle AI Database 26ai Free** (23.26.3.0.0), installed natively at
  `C:\26_26\dbhomeFree`.
- **ORDS** v26.2.2.204.1619, installed at `C:\26_26\ords`, configured at
  `C:\ords_config`.
- Pluggable database: `freepdb1`.
- **Listener port is 1522, not the default 1521.** Check
  `C:\26_26\dbhomeFree\network\admin\listener.ora` or `lsnrctl status` if
  ever in doubt.
- Connect string used throughout: `@localhost:1522/freepdb1`.
- `sqlplus` is on PATH natively — no `docker exec` needed. Run scripts
  straight from this folder, e.g. `@"N:\mahal\mahal-v1\backend\oracle\provision_mahaldb.sql"`.

## 1. Start the database

Two Windows services must both be `RUNNING`:

```
sc query OracleServiceFREE
sc query OracleOraDB23Home1TNSListener
```

If either is stopped, start it from an **elevated** Command Prompt:

```
net start OracleServiceFREE
net start OracleOraDB23Home1TNSListener
```

## 2. One-time schema provisioning

Run in order, connected as `SYS AS SYSDBA` to `localhost:1522/freepdb1`:

1. `provision_mahaldb.sql` — creates the `MAHALDB` schema/user, tables
   (`cities`, `categories`, `venues`, `app_users`, `inquiries`, `bookings`,
   `payments`, `reviews`), the rating-sync trigger, a `venues_flat` view,
   and an APEX workspace (`MAHALDB`) with an `ADMIN` user.
2. `05_fix_apex_admin_setup.sql` — **required, not optional** (see step 5
   below for why) — REST-enables the schema and fixes the ADMIN password
   and role grant. Without this, step 3 fails and APEX login doesn't work.
3. `enable_rest_mahaldb.sql` — enables REST on the individual tables/views.
4. `seed_mahaldb.sql` — seeds 12 venues, 2 demo users, lookup data.
5. `seed_reviews.sql` — seeds 24 reviews.

```
sqlplus sys/<your-sys-password>@localhost:1522/freepdb1 as sysdba
SQL> @"N:\mahal\mahal-v1\backend\oracle\provision_mahaldb.sql"
SQL> @"N:\mahal\mahal-v1\backend\oracle\05_fix_apex_admin_setup.sql"
SQL> @"N:\mahal\mahal-v1\backend\oracle\enable_rest_mahaldb.sql"
SQL> @"N:\mahal\mahal-v1\backend\oracle\seed_mahaldb.sql"
SQL> @"N:\mahal\mahal-v1\backend\oracle\seed_reviews.sql"
```

Passwords are yours to set — see `CREDENTIALS.local.md` (gitignored, never
commit it) for the ones currently in use on nora.

## 3. Install and configure ORDS (one-time)

```
C:\26_26\ords\bin\ords.exe --config C:\ords_config install
```
Basic connection type, host `localhost`, port `1522`, service name
`freepdb1`, administrator `SYS AS SYSDBA`, defaults otherwise (Standalone
Mode, HTTP, port 8080).

**APEX static resources (images/CSS/JS).** Point ORDS at wherever the APEX
`images` folder actually lives — verify with `dir`, don't assume a copy
landed where you told it to:
```
C:\26_26\ords\bin\ords.exe --config C:\ords_config config set standalone.static.path "C:\26_26\apex\apex\images"
```

## 4. Run it day to day

**ORDS (window 1) no longer needs a terminal window at all — see §3.5
below.** Once `install-ords-service.ps1` has been run once, ORDS starts
itself at boot and restarts itself if it ever dies. Only backend and
frontend still need manual terminal windows:

| Window | Command | URL |
|---|---|---|
| ~~1 — ORDS~~ | now automatic — see §3.5 | http://localhost:8080 |
| 2 — Backend | `cd mahal-v1\backend && npm start` | http://localhost:4000 (API only, no homepage) |
| 3 — Frontend | `cd mahal-v1\frontend && npm run dev` | **http://localhost:5173** ← the actual site |

If you ever need to run ORDS manually instead (e.g. debugging), the
original command still works:
```
C:\26_26\ords\bin\ords.exe --config C:\ords_config serve
```
**Do not click inside that window if you do this.** Clicking into a
Command Prompt window triggers Windows "Quick Edit Mode," which *pauses*
the whole process until Enter is pressed again — port 8080 goes
uncontactable and it looks exactly like a crash, but the process is only
suspended. This is exactly the failure §3.5 exists to eliminate.

If ORDS won't start with "port 8080 already in use":
```
netstat -ano | findstr :8080
taskkill /PID <pid> /F
```

## 3.5. Permanent ORDS startup (recommended — do this once)

ORDS used to require a permanently-open Command Prompt window (window 1
above), which was fragile: clicking into it paused it (Quick Edit Mode),
and it never came back after a crash or reboot. This is fixed by
registering ORDS as a Windows Scheduled Task instead of a foreground
process.

`backend/oracle/install-ords-service.ps1` does this. **Run once, in an
elevated PowerShell:**
```
cd N:\mahal\mahal-v1\backend\oracle
.\install-ords-service.ps1
```

What it sets up (task name **"ORDS Server"** in Task Scheduler):
- Starts automatically 2 minutes after every boot
- Re-checks every 5 minutes and restarts ORDS if it isn't running
  (self-healing watchdog — this is what makes it survive indefinitely,
  not just up to some crash-restart limit)
- Runs as SYSTEM with no visible console window — nothing to
  accidentally click into, so Quick Edit Mode can't pause it anymore
- No execution time limit, so Windows won't kill it after a few days

To check on it later:
```
Get-ScheduledTask -TaskName "ORDS Server" | Get-ScheduledTaskInfo
```
To stop it (e.g. for maintenance):
```
Stop-ScheduledTask -TaskName "ORDS Server"
```

`backend/.env` for the Oracle-backed setup:
```
PORT=4000
JWT_SECRET=<your own secret>
DB_DRIVER=oracle
ORDS_BASE_URL=http://localhost:8080/ords/mahaldb
```
(`DB_DRIVER=json` also works, with no Oracle needed, for pure frontend
work — see the root `README.md`.)

## 5. Why step 2.2 exists — two gotchas that cost real time

**A. Schema REST-enable is separate from table/view REST-enable.**
`enable_rest_mahaldb.sql` fails with `ORA-20012: Schema not REST enabled :
MAHALDB` even after ORDS itself is installed, until the schema itself is
REST-enabled once via `ORDS.ENABLE_SCHEMA`.

**B. `APEX_UTIL.CREATE_USER` alone doesn't produce a usable login.**
It creates the ADMIN user, but with no working password and no
developer/admin role — login redirects to a "Restricted End User Access"
page. Two things are needed on top: a password reset via
`APEX_UTIL.EDIT_USER`, and a role grant via the same call's
`p_developer_roles` parameter — which takes a **colon-separated legacy
privilege list**, not human-readable names ("Administrator:Application
Developer" silently no-ops). The working value is
`'ADMIN:CREATE:DATA_LOADER:EDIT:HELP:MONITOR:SQL'`.

If an APEX/Oracle built-in package's exact parameter names are ever
uncertain, don't guess from memory of the docs — query `ALL_ARGUMENTS`
(resolving synonyms first via `ALL_SYNONYMS`) for the real signature, and
grep `ALL_SOURCE` for the package's own documented examples if a
parameter's valid values aren't obvious.

## 6. Confirmed working chain (2026-09-11)

- `http://localhost:8080/ords/mahaldb/venues/` → 12 venues via ORDS
- `http://localhost:4000/api/venues` → same 12 venues via the Node backend
- **`http://localhost:5173`** → "Mahal — Morocco Venue Marketplace," the
  live React frontend, reading real data through the chain above
- `http://localhost:8080/ords/apex` → APEX workspace login, workspace
  `MAHALDB`, user `ADMIN` — full admin/developer rights confirmed

## 6.5. APEX app export/backup habit (do this regularly — see why below)

**App 102, the original "Mahal Admin" APEX app, was lost completely** —
App Builder showed 0 applications, Workspace Home showed 0 applications,
and Workspace Utilities → Manage Backups was empty. No cause was ever
found, and nothing was recoverable. It was rebuilt from scratch as
**App 100**. Don't let this happen again — export after any meaningful
change to app 100 (a page redesign, new region, fixed bug) and commit
the export alongside your other changes, the same way you'd commit code:

1. App Builder → open **Application 100** → **App Builder actions** (or
   the wrench/utilities icon) → **Export**.
2. Application: 100. Format: **SQL**. Type: **Standard Export** (the
   default — includes developer metadata, recommended for source
   control).
3. Click Export — downloads `f100.sql`.
4. Replace `backend/oracle/f100.sql` in the repo with the new export and
   commit it. To reimport if App 100 is ever lost again: run
   `f100.sql` as the `MAHALDB` schema owner (or a user with
   `APEX_ADMINISTRATOR_ROLE`) via sqlplus or SQL Commands.

`backend/oracle/f100.sql` (first committed 2026-09-15, exported right
after the App 100 rebuild) is the current baseline — keep it up to date.

## 7. Still open

- **APEX admin pages/reports** — App 102 (the original "Mahal Admin"
  APEX app) was lost with no backup (see §6.5) and was rebuilt from
  scratch as **App 100** (same name, "Mahal Admin"): Venues report/form,
  Manage Inquiries grid, Reviews grid, Analytics chart. Reviews page had
  a wizard-introduced bug (ID column wrongly wired to a venue-name LOV
  that belongs on VENUE_ID instead) — fixed 2026-09-15 by deleting and
  recreating the Interactive Grid region fresh against the REVIEWS table
  (a column-type edit alone wasn't enough).
- ~~Wrap ORDS as a proper Windows service~~ — done, see §3.5. Run
  `install-ords-service.ps1` once if you haven't yet.
- Deploying `mahal-v1` itself (Render) is a separate, not-yet-actioned
  track — see `DEPLOY.md` / `render.yaml`. Render's disk is ephemeral and
  can't reach a localhost-only Oracle DB, so a hosted deployment would run
  in `DB_DRIVER=json` mode, not against this Oracle setup.

## Recurring gotchas worth remembering

1. **Windows `cmd.exe`:** pasting several multi-line commands at once can
   silently merge lines (e.g. a PL/SQL block's closing `/` merging with
   the next line's `@script.sql`). Paste one command/block at a time.
2. `<` and `>` in a command are shell redirection operators — a literal
   placeholder like `<app_pwd>` typed as-is doesn't error clearly. Always
   use a fully substituted, concrete value.
3. It's easy to type a command into the wrong window — SQL into `cmd.exe`,
   an OS command into an active `sqlplus` session, or a new command into a
   window already busy running a foreground server. Check the prompt
   before typing.
4. All 3 windows in step 4 must stay open and untouched at once — closing
   *or* clicking into any one of them silently breaks things elsewhere.
