-- Approval workflow for inquiries -> bookings (the "Approve/Reject" part
-- of the admin round-trip). Run AFTER provision_mahaldb.sql. Exposes a
-- small package the APEX Manage Inquiries page can call from a process:
--
--   mahal_booking_approval.approve_inquiry(p_inquiry_id => :P4_INQUIRY_ID);
--   mahal_booking_approval.reject_inquiry(p_inquiry_id => :P4_INQUIRY_ID);
--
-- APPROVE: only from status 'new' (guards against double-approval via the
-- FOR UPDATE row lock). Requires the inquiry to have a venue (bookings.
-- venue_id is NOT NULL). Resolves the guest: inquiry.user_id first, else
-- app_users matched by email, else NULL. Copies event_date/guest_count,
-- sets status 'pending' (matches the column DEFAULT), and estimates
-- total_price from the venue's price_from (NULL if the venue has none).
-- Marks the inquiry 'approved'.
--
-- REJECT: marks the inquiry 'rejected'. Allowed from 'new' only.
--
-- Status strings chosen here ('approved'/'rejected') match AGENTS.md's
-- plan for this feature. The older ER-DIAGRAM.md used 'accepted'/
-- 'declined' — if that vocabulary is preferred, change the two string
-- constants below; nothing else in this file depends on them.
--
-- Run as the mahaldb schema owner:
--   sqlplus mahaldb/<app_pwd>@localhost:1522/freepdb1 @07_booking_approval.sql
-- Re-runnable (CREATE OR REPLACE + guarded sequence).

SET DEFINE OFF
SET ECHO ON
WHENEVER SQLERROR EXIT FAILURE

-- Bookings ids are 'bk' + 8-digit sequence (venues use 'vNNN', inquiries
-- use nanoid from Node). Guarded so the file is safe to re-run.
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

CREATE OR REPLACE PACKAGE mahal_booking_approval AS
  PROCEDURE approve_inquiry(p_inquiry_id IN VARCHAR2);
  PROCEDURE reject_inquiry(p_inquiry_id IN VARCHAR2);
END mahal_booking_approval;
/

CREATE OR REPLACE PACKAGE BODY mahal_booking_approval AS

  PROCEDURE approve_inquiry(p_inquiry_id IN VARCHAR2) IS
    CURSOR c_inquiry IS
      SELECT i.venue_id, i.user_id, i.email, i.guests, i.event_date, i.status
        FROM inquiries i
       WHERE i.id = p_inquiry_id
         FOR UPDATE OF i.status;
    v_inquiry      c_inquiry%ROWTYPE;
    v_guest_id     app_users.id%TYPE;
    v_price        venues.price_from%TYPE;
    v_booking_id   bookings.id%TYPE;
  BEGIN
    OPEN c_inquiry;
    FETCH c_inquiry INTO v_inquiry;
    IF c_inquiry%NOTFOUND THEN
      CLOSE c_inquiry;
      RAISE_APPLICATION_ERROR(-20001, 'Inquiry ' || p_inquiry_id || ' not found');
    END IF;
    CLOSE c_inquiry;

    IF v_inquiry.venue_id IS NULL THEN
      RAISE_APPLICATION_ERROR(-20002, 'Inquiry ' || p_inquiry_id || ' has no venue and cannot become a booking');
    END IF;

    IF v_inquiry.status != 'new' THEN
      RAISE_APPLICATION_ERROR(-20003, 'Inquiry ' || p_inquiry_id || ' is already processed (status: ' || v_inquiry.status || ')');
    END IF;

    -- Resolve the guest: honor an explicit user_id, else find app_users by email.
    v_guest_id := v_inquiry.user_id;
    IF v_guest_id IS NULL THEN
      BEGIN
        SELECT id INTO v_guest_id
          FROM app_users
         WHERE LOWER(TRIM(email)) = LOWER(TRIM(v_inquiry.email));
      EXCEPTION
        WHEN NO_DATA_FOUND THEN v_guest_id := NULL;
      END;
    END IF;

    -- Estimated booking value from the venue's posted price_from.
    SELECT price_from INTO v_price FROM venues WHERE id = v_inquiry.venue_id;

    v_booking_id := 'bk' || LPAD(bookings_id_seq.NEXTVAL, 8, '0');

    INSERT INTO bookings (id, venue_id, guest_id, event_date, guest_count, status, total_price)
    VALUES (v_booking_id, v_inquiry.venue_id, v_guest_id, v_inquiry.event_date, v_inquiry.guests, 'pending', v_price);

    UPDATE inquiries SET status = 'approved' WHERE id = p_inquiry_id;

    COMMIT;
  END approve_inquiry;

  PROCEDURE reject_inquiry(p_inquiry_id IN VARCHAR2) IS
  BEGIN
    UPDATE inquiries SET status = 'rejected' WHERE id = p_inquiry_id AND status = 'new';
    IF SQL%ROWCOUNT = 0 THEN
      RAISE_APPLICATION_ERROR(-20003, 'Inquiry ' || p_inquiry_id || ' not found or already processed');
    END IF;
    COMMIT;
  END reject_inquiry;

END mahal_booking_approval;
/

PROMPT DONE — package MAHAL_BOOKING_APPROVAL created. Call from an APEX
PROMPT process (see AGENTS.md / the App Builder checklist) as:
PROMPT   mahal_booking_approval.approve_inquiry(:P4_INQUIRY_ID);
PROMPT   mahal_booking_approval.reject_inquiry(:P4_INQUIRY_ID);
EXIT;