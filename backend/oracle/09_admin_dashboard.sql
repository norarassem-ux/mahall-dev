-- Admin dashboard round 2: lets the mahal-v1 WEB APP's own admin role
-- (not just the separate APEX "Mahal Admin" App 100 login) receive every
-- inquiry, approve/reject it into a booking, and see each venue's
-- calendar of bookings — plus creates one full-admin account per venue.
--
-- Run AFTER provision_mahaldb.sql, enable_rest_mahaldb.sql and
-- 07_booking_approval.sql (only needed here for the BOOKINGS_ID_SEQ
-- sequence it created; that sequence is re-created below too, guarded,
-- in case this script is ever run standalone).
--
-- WHAT THIS DOES
-- 1. Exposes BOOKINGS over ORDS AutoREST (read-only use from Node: the
--    calendar UI lists a venue's bookings) — same posture as the other
--    AutoREST resources in this schema (auth disabled at the DB level;
--    the Node app's own JWT/requireAdmin is what actually gates access).
-- 2. Adds two custom ORDS PL/SQL handlers, /inquiry-approve/ and
--    /inquiry-reject/, so the Node backend can approve/reject an inquiry
--    without a native Oracle driver (same pattern as /venue-create/ in
--    enable_rest_mahaldb.sql). Their guard rules deliberately MATCH what
--    is already live on APEX Page 4 "Manage Inquiries" (see AGENTS.md
--    Part 2) so the two admin surfaces never disagree about the same
--    inquiry:
--      approve: blocked only if the inquiry has no venue_id, or is
--        already 'approved'. (Approving a previously-rejected inquiry
--        IS allowed, same as Page 4.)
--      reject: unconditional, no guard — "Reject can still override an
--        approval" (Gamal's explicit product decision, recorded in
--        AGENTS.md). A reject after an approval does NOT touch the
--        booking row it created, which is left orphaned as 'pending' —
--        same known, accepted trade-off as Page 4.
--    Unlike Page 4's inline version, these DO resolve the guest by email
--    when the inquiry has no user_id, and DO estimate total_price from
--    the venue's price_from — both were flagged in AGENTS.md as value
--    the unused MAHAL_BOOKING_APPROVAL package has that Page 4 lacks;
--    adopting them here is a strict improvement, not a behavior change.
-- 3. Creates one ADMIN-role app_users account per existing venue —
--    email venue-admin-<slug>@mahal.city, password VenueAdmin2026!
--    (shared across all of them, change per-account later via the
--    Account page's "Change password" if you want them distinct). Each
--    one is a full admin (role='admin'), identical in privilege to
--    admin@mahal.city — sees and can act on every venue, not just the
--    one it's named after. Idempotent: safe to re-run after adding
--    venues later, only creates the ones that don't exist yet.
--
-- Run as the mahaldb schema owner, connected directly via TNS -- same
-- requirement as enable_rest_mahaldb.sql/07_booking_approval.sql, and NOT
-- optional here: ORDS.DEFINE_MODULE (used below) attaches a new module to
-- whichever schema you're actually authenticated as -- unlike
-- ORDS.ENABLE_OBJECT (which takes an explicit p_schema), it ignores
-- ALTER SESSION SET CURRENT_SCHEMA entirely. Confirmed by hitting this
-- twice: running as SYS AS SYSDBA -- even after ALTER SESSION SET
-- CURRENT_SCHEMA = MAHALDB and after granting SYS the "INHERIT
-- PRIVILEGES" ORDS_METADATA needs to even be callable from a SYS session
-- -- still failed with "ORA-20012: Schema not REST enabled : SYS", because
-- the module got attached to SYS's (non-REST-enabled) identity, not
-- MAHALDB's. Connecting AS mahaldb sidesteps both issues at once.
--
--   sqlplus mahaldb/<mahaldb_password>@localhost:1522/freepdb1
--   @N:\mahal\mahal-v1\backend\oracle\09_admin_dashboard.sql
--
-- (mahaldb's password is in backend/oracle/CREDENTIALS.local.md, gitignored
-- -- open that file rather than pasting the password into a terminal
-- transcript. No ALTER SESSION SET CONTAINER here: a local, non-common
-- user like mahaldb only exists in one PDB, so the TNS connect string
-- above already puts the session in FREEPDB1 directly.)

SET SERVEROUTPUT ON
SET DEFINE OFF
SET ECHO ON
WHENEVER SQLERROR EXIT FAILURE

-- ---------------------------------------------------------------------
-- 1. Expose BOOKINGS over AutoREST (idempotent — ENABLE_OBJECT is safe
--    to call again with the same arguments).
-- ---------------------------------------------------------------------
BEGIN
  ORDS.ENABLE_OBJECT(p_enabled => TRUE, p_schema => 'MAHALDB', p_object => 'BOOKINGS', p_object_type => 'TABLE', p_object_alias => 'bookings', p_auto_rest_auth => FALSE);
  COMMIT;
END;
/

-- ---------------------------------------------------------------------
-- Guarded sequence (same as 07_booking_approval.sql — re-created here
-- too in case this script runs standalone).
-- ---------------------------------------------------------------------
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM user_sequences WHERE sequence_name = 'BOOKINGS_ID_SEQ';
  IF v_count = 0 THEN
    EXECUTE IMMEDIATE 'CREATE SEQUENCE bookings_id_seq START WITH 1 INCREMENT BY 1 NOCACHE';
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

-- ---------------------------------------------------------------------
-- 2. Custom ORDS handlers: /inquiry-approve/ and /inquiry-reject/
-- ---------------------------------------------------------------------
BEGIN
  ORDS.DEFINE_MODULE(
    p_module_name    => 'mahaldb.inquiry.approve',
    p_base_path      => '/inquiry-approve/',
    p_items_per_page => 0,
    p_status         => 'PUBLISHED'
  );

  ORDS.DEFINE_TEMPLATE(
    p_module_name => 'mahaldb.inquiry.approve',
    p_pattern     => '/'
  );

  ORDS.DEFINE_HANDLER(
    p_module_name => 'mahaldb.inquiry.approve',
    p_pattern     => '/',
    p_method      => 'POST',
    p_source_type => ORDS.source_type_plsql,
    p_source      => q'[
DECLARE
  v_venue_id    inquiries.venue_id%TYPE;
  v_user_id     inquiries.user_id%TYPE;
  v_email       inquiries.email%TYPE;
  v_guests      inquiries.guests%TYPE;
  v_event_date  inquiries.event_date%TYPE;
  v_status      inquiries.status%TYPE;
  v_guest_id    app_users.id%TYPE;
  v_price       venues.price_from%TYPE;
  v_booking_id  bookings.id%TYPE;
BEGIN
  BEGIN
    SELECT venue_id, user_id, email, guests, event_date, status
      INTO v_venue_id, v_user_id, v_email, v_guests, v_event_date, v_status
      FROM inquiries
     WHERE id = :inquiry_id
       FOR UPDATE;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RAISE_APPLICATION_ERROR(-20001, 'Inquiry not found');
  END;

  IF v_venue_id IS NULL THEN
    RAISE_APPLICATION_ERROR(-20002, 'Inquiry has no venue and cannot become a booking');
  END IF;

  IF v_status = 'approved' THEN
    RAISE_APPLICATION_ERROR(-20003, 'Inquiry is already approved');
  END IF;

  v_guest_id := v_user_id;
  IF v_guest_id IS NULL THEN
    BEGIN
      SELECT id INTO v_guest_id FROM app_users WHERE LOWER(TRIM(email)) = LOWER(TRIM(v_email));
    EXCEPTION
      WHEN NO_DATA_FOUND THEN v_guest_id := NULL;
    END;
  END IF;

  BEGIN
    SELECT price_from INTO v_price FROM venues WHERE id = v_venue_id;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN v_price := NULL;
  END;

  v_booking_id := 'bk' || LPAD(bookings_id_seq.NEXTVAL, 8, '0');

  INSERT INTO bookings (id, venue_id, guest_id, event_date, guest_count, status, total_price)
  VALUES (v_booking_id, v_venue_id, v_guest_id, v_event_date, v_guests, 'pending', v_price);

  UPDATE inquiries SET status = 'approved' WHERE id = :inquiry_id;

  COMMIT;
END;
]'
  );

  COMMIT;
END;
/

BEGIN
  ORDS.DEFINE_MODULE(
    p_module_name    => 'mahaldb.inquiry.reject',
    p_base_path      => '/inquiry-reject/',
    p_items_per_page => 0,
    p_status         => 'PUBLISHED'
  );

  ORDS.DEFINE_TEMPLATE(
    p_module_name => 'mahaldb.inquiry.reject',
    p_pattern     => '/'
  );

  ORDS.DEFINE_HANDLER(
    p_module_name => 'mahaldb.inquiry.reject',
    p_pattern     => '/',
    p_method      => 'POST',
    p_source_type => ORDS.source_type_plsql,
    p_source      => q'[
BEGIN
  UPDATE inquiries SET status = 'rejected' WHERE id = :inquiry_id;
  IF SQL%ROWCOUNT = 0 THEN
    RAISE_APPLICATION_ERROR(-20001, 'Inquiry not found');
  END IF;
  COMMIT;
END;
]'
  );

  COMMIT;
END;
/

-- ---------------------------------------------------------------------
-- 3. One full-admin account per existing venue (idempotent).
-- ---------------------------------------------------------------------
DECLARE
  v_count   NUMBER;
  v_hash    CONSTANT VARCHAR2(200) := '$2a$10$Vd07ELZ.NAWx/YGksywMted6uE98a19NzgLbmYoz.yYeQy53TMzRy'; -- VenueAdmin2026!
  v_email   VARCHAR2(200);
  v_id      VARCHAR2(20);
  v_created NUMBER := 0;
BEGIN
  FOR v IN (SELECT id, name, slug FROM venues ORDER BY id) LOOP
    v_email := 'venue-admin-' || v.slug || '@mahal.city';
    v_id := 'vadm_' || v.id;
    SELECT COUNT(*) INTO v_count FROM app_users WHERE email = v_email OR id = v_id;
    IF v_count = 0 THEN
      INSERT INTO app_users (id, email, name, role, password_hash)
      VALUES (v_id, v_email, v.name || ' Admin', 'admin', v_hash);
      v_created := v_created + 1;
    END IF;
  END LOOP;
  COMMIT;
  DBMS_OUTPUT.PUT_LINE(v_created || ' venue-admin account(s) created (password: VenueAdmin2026!).');
END;
/

PROMPT DONE — bookings/ (AutoREST), /inquiry-approve/, /inquiry-reject/ live.
PROMPT Venue-admin accounts:
SELECT id, email, name, role FROM app_users WHERE id LIKE 'vadm\_%' ESCAPE '\' ORDER BY id;
EXIT;
