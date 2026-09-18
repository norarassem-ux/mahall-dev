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
6. `07_booking_approval.sql` — (triggered later, 2026-09-15; not part of
   the original 1–5) creates the `MAHAL_BOOKING_APPROVAL` package that the
   Manage Inquiries approve/reject workflow calls. Safe/re-runnable —
   include it if you're ever re-provisioning from scratch.

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

**None of the three need a terminal window anymore — see §3.5, §3.6 and
§3.7 below.** Once `install-ords-service.ps1`,
`install-backend-service.ps1` and `install-frontend-service.ps1` have
each been run once, all three start themselves at boot and restart
themselves if they ever die or stop responding:

| Window | Command | URL |
|---|---|---|
| ~~1 — ORDS~~ | now automatic — see §3.5 | http://localhost:8080 |
| ~~2 — Backend~~ | now automatic — see §3.6 | http://localhost:4000 (API only, no homepage) |
| ~~3 — Frontend~~ | now automatic — see §3.7 | **http://localhost:5173** ← the actual site |

If you ever need to run the frontend manually instead (e.g. debugging),
the original command still works: `cd mahal-v1\frontend && npm run dev`
— same Quick Edit Mode caution as ORDS applies to that window too.

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

The same applies to the backend on port 4000 — if it's stuck bound but not
responding (see §3.6), find the PID with `netstat -ano | findstr :4000`
and kill it the same way before restarting.

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

## 3.6. Permanent backend startup (recommended — do this once)

The backend (window 2 above, `npm start`) turned out to be just as
vulnerable to the Quick Edit Mode failure as ORDS was. On 2026-09-15 it
was found `LISTENING` on port 4000 (confirmed via `netstat`) but not
answering *any* request — not even `/api/health`, which touches no
database at all — almost certainly the same "clicked into the console
window and paused it" failure as §3.5, just hitting the backend's window
instead of ORDS's. Fixed the same way: a Scheduled Task instead of a
foreground process.

`backend/oracle/install-backend-service.ps1` does this. **Run once, in an
elevated PowerShell:**
```
cd N:\mahal\mahal-v1\backend\oracle
.\install-backend-service.ps1
```

What it sets up (task name **"Mahal Backend Server"** in Task Scheduler):
- Finds and kills whatever's currently bound to port 4000 first (only that
  process, not every `node.exe` — safe to run even with the frontend's
  Vite dev server also running as `node.exe` on a different port)
- Starts automatically 4 minutes after every boot (2 minutes after ORDS,
  so ORDS is already answering by the time the backend's first Oracle call
  happens)
- Re-checks every 5 minutes and restarts the backend if it isn't running
  (same self-healing watchdog pattern as ORDS)
- Runs as SYSTEM with no visible console window
- Logs to `backend/backend.log` — check that file instead of needing a
  terminal window open if something looks wrong
- No execution time limit

To check on it later:
```
schtasks /Query /TN "Mahal Backend Server" /V /FO LIST
```
To stop it (e.g. for maintenance):
```
schtasks /End /TN "Mahal Backend Server"
```

(Confirmed `N:` is a real local Fixed Drive on nora — not a `net use`
mapping or a `subst` alias — via `fsutil fsinfo drivetype N:`, so the
SYSTEM-context task can use `N:\...` paths directly with no translation
needed. If this is ever run on a machine where `N:` *is* a mapped or
`subst` drive, resolve it to a real UNC/local path first — a SYSTEM task
can't see per-user drive mappings.)

## 3.7. Permanent frontend startup (recommended — do this once)

Same reasoning and same fix as §3.5/§3.6, applied to the frontend
(`npm run dev`, port 5173) — any foreground console window is one
accidental click away from Quick Edit Mode pausing it, and won't come
back after a crash or reboot on its own either.

`backend/oracle/install-frontend-service.ps1` does this. **Run once, in
an elevated PowerShell:**
```
cd N:\mahal\mahal-v1\backend\oracle
.\install-frontend-service.ps1
```

What it sets up (task name **"Mahal Frontend Server"** in Task
Scheduler):
- Finds and kills only whatever's currently bound to port 5173 first
- Starts automatically 3 minutes after every boot
- Re-checks every 5 minutes and restarts it if it isn't running
- Runs as SYSTEM with no visible console window
- Logs to `frontend/frontend.log`
- No execution time limit

To check on it later:
```
schtasks /Query /TN "Mahal Frontend Server" /V /FO LIST
```
To stop it (e.g. for maintenance):
```
schtasks /End /TN "Mahal Frontend Server"
```

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
- ~~Wrap the backend as a proper Windows service~~ — done, see §3.6. Run
  `install-backend-service.ps1` once if you haven't yet.
- ~~Wrap the frontend as a proper Windows service~~ — done, see §3.7. Run
  `install-frontend-service.ps1` once if you haven't yet.
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
4. No windows need to stay open now — ORDS, the backend, and the
   frontend all run as Scheduled Tasks (§3.5, §3.6, §3.7) with no window
   to close or click into.
5. `cmd.exe`'s plain `cd` does **not** switch drive letters — running
   `cd N:\mahal\...` while sitting on `C:` silently leaves you on `C:`
   still (next command fails with a confusing "file not found" pointing
   at the wrong drive). Use `cd /d N:\mahal\...` instead, or switch
   drives first by typing `N:` on its own line.
6. `wmic` is removed on newer Windows builds — use `fsutil fsinfo
   drivetype <letter>:` instead to check whether a drive is a real local
   disk ("Fixed Drive") vs. a network drive; `net use` and `subst` only
   show *mapped*/`subst`'d drives, not real disk letters, so both coming
   back empty doesn't mean the drive doesn't exist.
7. If you ever hand-edit a Scheduled Task XML (as `install-ords-service.ps1`
   and `install-backend-service.ps1` do via `schtasks /Create /XML`):
   it's real XML, so `&` inside an `<Arguments>` value (e.g. `2>&1` for
   log redirection) must be escaped as `&amp;`, or `schtasks` rejects the
   whole file with "The task XML is malformed" — a bug hit and fixed
   2026-09-15 while writing `install-backend-service.ps1`.
