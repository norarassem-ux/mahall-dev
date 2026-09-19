-- Scopes each of the 12 per-venue admin accounts (created by
-- 09_admin_dashboard.sql) to their own venue only. Follow-up to a
-- product decision: admin@mahal.city remains the one and only account
-- with full access to every venue; each venue-admin-<slug>@mahal.city
-- account should see and act on only its own venue's leads and calendar.
--
-- Run connected directly as mahaldb via TNS (same requirement as
-- 09_admin_dashboard.sql — ORDS.ENABLE_OBJECT/DEFINE_MODULE ignore
-- CURRENT_SCHEMA and need the session's real authenticated identity to
-- be mahaldb, see that file's header for the full explanation):
--   sqlplus mahaldb/<mahaldb_password>@localhost:1522/freepdb1
--   @N:\mahal\mahal-v1\backend\oracle\10_venue_admin_scope.sql
--
-- WHAT THIS DOES
-- 1. Adds a nullable VENUE_ID column to APP_USERS. NULL = unrestricted
--    admin (only admin@mahal.city should ever have role='admin' with a
--    NULL venue_id); non-null = that admin is scoped to exactly one
--    venue, same as an owner scoped to their own listings.
-- 2. Backfills VENUE_ID for the 12 existing vadm_<venue.id> accounts by
--    parsing it back out of their own id (vadm_v001 -> v001). Idempotent
--    — only touches rows still NULL, so safe to re-run.
-- 3. Re-exposes APP_USERS over AutoREST so ORDS picks up the new column
--    (idempotent — same call as enable_rest_mahaldb.sql).
--
-- The Node-side scoping this column drives lives in
-- backend/src/routes/owner.js (My venues / Leads / Booking calendar)
-- and backend/src/routes/inquiries.js (approve/reject 403s a scoped
-- admin who tries to act on another venue's inquiry).
--
-- After running this, any of the 12 venue-admin accounts that are
-- already logged in in a browser need to log out and back in — their
-- existing JWT was signed before this change and won't carry venueId
-- until they get a fresh one.

SET SERVEROUTPUT ON
SET DEFINE OFF
SET ECHO ON
WHENEVER SQLERROR EXIT FAILURE

-- ---------------------------------------------------------------------
-- 1. Add the column (guarded — safe to re-run).
-- ---------------------------------------------------------------------
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM user_tab_columns WHERE table_name = 'APP_USERS' AND column_name = 'VENUE_ID';
  IF v_count = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE app_users ADD (venue_id VARCHAR2(20))';
  END IF;
END;
/

-- ---------------------------------------------------------------------
-- 2. Backfill for the existing venue-admin accounts.
-- ---------------------------------------------------------------------
UPDATE app_users
   SET venue_id = SUBSTR(id, 6)
 WHERE id LIKE 'vadm\_%' ESCAPE '\'
   AND venue_id IS NULL;
COMMIT;

-- ---------------------------------------------------------------------
-- 3. Re-expose APP_USERS over AutoREST so the new column is visible.
-- ---------------------------------------------------------------------
BEGIN
  ORDS.ENABLE_OBJECT(p_enabled => TRUE, p_schema => 'MAHALDB', p_object => 'APP_USERS', p_object_type => 'TABLE', p_object_alias => 'users', p_auto_rest_auth => FALSE);
  COMMIT;
END;
/

PROMPT DONE — venue_id column added/backfilled, APP_USERS AutoREST refreshed.
PROMPT Venue-admin accounts and their scope:
SELECT id, email, role, venue_id FROM app_users WHERE id LIKE 'vadm\_%' ESCAPE '\' ORDER BY id;
EXIT;
