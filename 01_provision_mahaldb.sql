-- Provisions MAHALDB — a second, better-normalized schema than the
-- original MAHAL_APP (see provision.sql): proper CITIES/CATEGORIES
-- lookup tables with FK integrity on venues, plus a venues_flat VIEW
-- that joins the names back in so the Node backend's shape doesn't
-- change at all — only backend/.env's ORDS_BASE_URL needs to point here.
--
-- Run as: sqlplus / as sysdba @provision_mahaldb.sql
-- (OS authentication — no password typed here. Prompts once for the
-- two new passwords it needs to create.)

SET DEFINE OFF
SET SERVEROUTPUT ON
SET ECHO ON
WHENEVER SQLERROR CONTINUE

ALTER SESSION SET CONTAINER = FREEPDB1;

ACCEPT app_pwd CHAR PROMPT 'New password for the MAHALDB schema user: ' HIDE
ACCEPT workspace_admin_pwd CHAR PROMPT 'New password for the APEX workspace ADMIN user: ' HIDE

-- 1. Application schema
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM dba_users WHERE username = 'MAHALDB';
  IF v_count = 0 THEN
    EXECUTE IMMEDIATE 'CREATE USER mahaldb IDENTIFIED BY "&app_pwd" DEFAULT TABLESPACE users QUOTA UNLIMITED ON users';
  END IF;
END;
/

GRANT CONNECT, RESOURCE TO mahaldb;
GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE VIEW TO mahaldb;

-- 2. REST-enable the schema (base path /ords/mahaldb/)
BEGIN
  ORDS_ADMIN.ENABLE_SCHEMA(
    p_enabled             => TRUE,
    p_schema              => 'MAHALDB',
    p_url_mapping_type    => 'BASE_PATH',
    p_url_mapping_pattern => 'mahaldb',
    p_auto_rest_auth      => FALSE
  );
  COMMIT;
END;
/

ALTER SESSION SET CURRENT_SCHEMA = MAHALDB;

-- 3. Tables (drop-if-exists guards so this script is re-runnable)
BEGIN EXECUTE IMMEDIATE 'DROP TABLE reviews'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE payments'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE bookings'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE inquiries'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE app_users'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE venues'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE categories'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE cities'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP VIEW venues_flat'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

CREATE TABLE cities (
  city_id   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  city_name VARCHAR2(80) NOT NULL UNIQUE
);

CREATE TABLE categories (
  category_id   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug          VARCHAR2(50) NOT NULL UNIQUE,
  category_name VARCHAR2(80) NOT NULL
);

CREATE TABLE venues (
  id            VARCHAR2(20) PRIMARY KEY,
  name          VARCHAR2(200) NOT NULL,
  slug          VARCHAR2(200) UNIQUE NOT NULL,
  category_id   NUMBER NOT NULL REFERENCES categories(category_id),
  city_id       NUMBER NOT NULL REFERENCES cities(city_id),
  area          VARCHAR2(150),
  capacity      NUMBER,
  price_from    NUMBER,
  amenities     CLOB CHECK (amenities IS JSON),
  rating        NUMBER(2,1),
  reviews_count NUMBER DEFAULT 0,
  host_name     VARCHAR2(150),
  host_email    VARCHAR2(200),
  host_phone    VARCHAR2(50),
  description   CLOB,
  status        VARCHAR2(20) DEFAULT 'live',
  featured      NUMBER(1) DEFAULT 0,
  owner_id      VARCHAR2(20),
  image_url     VARCHAR2(500),
  created_at    TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE TABLE app_users (
  id            VARCHAR2(20) PRIMARY KEY,
  email         VARCHAR2(200) UNIQUE NOT NULL,
  name          VARCHAR2(150),
  role          VARCHAR2(20) DEFAULT 'client',
  password_hash VARCHAR2(200) NOT NULL,
  created_at    TIMESTAMP DEFAULT SYSTIMESTAMP
);

ALTER TABLE venues ADD CONSTRAINT fk_venues_owner FOREIGN KEY (owner_id) REFERENCES app_users(id);

CREATE TABLE inquiries (
  id          VARCHAR2(20) PRIMARY KEY,
  venue_id    VARCHAR2(20) REFERENCES venues(id),
  venue_name  VARCHAR2(200),
  name        VARCHAR2(150),
  email       VARCHAR2(200),
  event_type  VARCHAR2(100),
  event_date  VARCHAR2(20),
  guests      NUMBER,
  message     CLOB,
  status      VARCHAR2(20) DEFAULT 'new',
  user_id     VARCHAR2(20) REFERENCES app_users(id),
  created_at  TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- ORDS AutoREST inserts explicitly send NULL for any JSON field the
-- client omits (i.e. created_at), which bypasses a plain column
-- DEFAULT — the DB never gets a chance to apply SYSTIMESTAMP. app_users
-- and inquiries are both written via raw AutoREST POST (unlike venues,
-- which goes through the custom /venue-create/ handler and is unaffected),
-- so both need a trigger that overrides the explicit NULL.
CREATE OR REPLACE TRIGGER inquiries_default_created_at
BEFORE INSERT ON inquiries
FOR EACH ROW
BEGIN
  IF :NEW.created_at IS NULL THEN
    :NEW.created_at := SYSTIMESTAMP;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER app_users_default_created_at
BEFORE INSERT ON app_users
FOR EACH ROW
BEGIN
  IF :NEW.created_at IS NULL THEN
    :NEW.created_at := SYSTIMESTAMP;
  END IF;
END;
/

CREATE TABLE bookings (
  id           VARCHAR2(20) PRIMARY KEY,
  venue_id     VARCHAR2(20) NOT NULL REFERENCES venues(id),
  guest_id     VARCHAR2(20) REFERENCES app_users(id),
  event_date   VARCHAR2(20),
  guest_count  NUMBER,
  status       VARCHAR2(20) DEFAULT 'pending',
  total_price  NUMBER,
  created_at   TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE TABLE payments (
  id             VARCHAR2(20) PRIMARY KEY,
  booking_id     VARCHAR2(20) NOT NULL REFERENCES bookings(id),
  amount         NUMBER,
  payment_method VARCHAR2(30),
  payment_status VARCHAR2(20) DEFAULT 'pending',
  paid_at        TIMESTAMP
);

CREATE TABLE reviews (
  id           VARCHAR2(20) PRIMARY KEY,
  venue_id     VARCHAR2(20) NOT NULL REFERENCES venues(id),
  user_id      VARCHAR2(20) REFERENCES app_users(id),
  rating       NUMBER(1) CHECK (rating BETWEEN 1 AND 5),
  comment_text VARCHAR2(2000),
  created_at   TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- venues.rating / reviews_count are maintained off real review rows, not
-- static seed placeholders. Compound trigger (not a plain row trigger) to
-- avoid ORA-04091 "table is mutating" when aggregating reviews from
-- within its own trigger.
CREATE OR REPLACE TRIGGER reviews_sync_venue_rating
FOR INSERT OR UPDATE OR DELETE ON reviews
COMPOUND TRIGGER

  TYPE venue_id_set_t IS TABLE OF BOOLEAN INDEX BY VARCHAR2(20);
  affected_venues venue_id_set_t;

  BEFORE EACH ROW IS
  BEGIN
    IF INSERTING OR UPDATING THEN
      affected_venues(:NEW.venue_id) := TRUE;
    END IF;
    IF UPDATING OR DELETING THEN
      affected_venues(:OLD.venue_id) := TRUE;
    END IF;
  END BEFORE EACH ROW;

  AFTER STATEMENT IS
    v_venue_id VARCHAR2(20);
    v_avg      NUMBER;
    v_count    NUMBER;
  BEGIN
    v_venue_id := affected_venues.FIRST;
    WHILE v_venue_id IS NOT NULL LOOP
      SELECT ROUND(AVG(rating), 1), COUNT(*) INTO v_avg, v_count
      FROM reviews WHERE venue_id = v_venue_id;

      UPDATE venues SET rating = NVL(v_avg, 0), reviews_count = v_count WHERE id = v_venue_id;

      v_venue_id := affected_venues.NEXT(v_venue_id);
    END LOOP;
  END AFTER STATEMENT;

END reviews_sync_venue_rating;
/

-- 4. Flat view — matches the exact shape the Node backend already expects
CREATE OR REPLACE VIEW venues_flat AS
SELECT v.id, v.name, v.slug, c.slug AS category, ci.city_name AS city, v.area,
       v.capacity, v.price_from, v.amenities, v.rating, v.reviews_count,
       v.host_name, v.host_email, v.host_phone, v.description, v.status,
       v.featured, v.owner_id, v.image_url, v.created_at
FROM venues v
JOIN categories c ON c.category_id = v.category_id
JOIN cities ci ON ci.city_id = v.city_id;

-- venues_flat is a join view, so plain AutoREST can't INSERT through it
-- (Oracle rejects the RETURNING ROWID clause ORDS generates for view
-- writes: ORA-22816). This INSTEAD OF trigger is only used by direct SQL
-- against the view — the actual write path for the app is the separate
-- /venue-create/ ORDS handler defined in enable_rest_mahaldb.sql, which
-- avoids that limitation entirely. Kept for anyone scripting inserts by
-- hand against venues_flat directly.
CREATE OR REPLACE TRIGGER venues_flat_insert
INSTEAD OF INSERT ON venues_flat
FOR EACH ROW
DECLARE
  v_city_id     NUMBER;
  v_category_id NUMBER;
BEGIN
  BEGIN
    SELECT city_id INTO v_city_id FROM cities WHERE city_name = :NEW.city;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      INSERT INTO cities (city_name) VALUES (:NEW.city) RETURNING city_id INTO v_city_id;
  END;

  SELECT category_id INTO v_category_id FROM categories WHERE slug = :NEW.category;

  INSERT INTO venues (
    id, name, slug, category_id, city_id, area, capacity, price_from, amenities,
    rating, reviews_count, host_name, host_email, host_phone, description, status, featured, owner_id, image_url
  ) VALUES (
    :NEW.id, :NEW.name, :NEW.slug, v_category_id, v_city_id, :NEW.area, :NEW.capacity, :NEW.price_from, :NEW.amenities,
    NVL(:NEW.rating, 0), NVL(:NEW.reviews_count, 0), :NEW.host_name, :NEW.host_email, :NEW.host_phone,
    :NEW.description, NVL(:NEW.status, 'live'), NVL(:NEW.featured, 0), :NEW.owner_id, :NEW.image_url
  );
END;
/

-- 5. APEX workspace for the admin console
BEGIN
  APEX_INSTANCE_ADMIN.ADD_WORKSPACE(
    p_workspace      => 'MAHALDB',
    p_primary_schema => 'MAHALDB'
  );
  COMMIT;
END;
/

DECLARE
  v_id NUMBER;
BEGIN
  v_id := APEX_UTIL.FIND_SECURITY_GROUP_ID(p_workspace => 'MAHALDB');
  APEX_UTIL.SET_SECURITY_GROUP_ID(v_id);
  APEX_UTIL.CREATE_USER(
    p_user_name       => 'ADMIN',
    p_web_password    => '&workspace_admin_pwd',
    p_developer_privs => 'ADMIN:CREATE:DATA_LOADER:EDIT:HELP:MONITOR:SQL',
    p_email_address   => 'admin@mahaldb.local'
  );
  COMMIT;
END;
/

PROMPT ----------------------------------------------------------------
PROMPT Schema + tables + view created. Now run, as the mahaldb user
PROMPT (same INHERIT PRIVILEGES quirk as the original schema):
PROMPT
PROMPT   sqlplus mahaldb/<app_pwd>@localhost:1521/FREEPDB1 @enable_rest_mahaldb.sql
PROMPT
PROMPT Then seed lookup + demo data:
PROMPT   sqlplus mahaldb/<app_pwd>@localhost:1521/FREEPDB1 @seed_mahaldb.sql
PROMPT ----------------------------------------------------------------
EXIT;
