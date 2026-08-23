-- Provisions the Oracle DB side of Mahal v1: an app schema, the
-- venues/users/inquiries tables, AutoREST on each (via ORDS), and an
-- APEX workspace for the future admin console (Wing A).
--
-- Prereqs: Oracle DB + ORDS + APEX installed locally, ORDS running
--   (java -jar ords.war --config <config-dir> serve), pluggable DB FREEPDB1.
--
-- Run as a DBA-privileged connection, e.g. from a Windows terminal:
--   sqlplus / as sysdba @provision.sql
-- (OS authentication — no password typed here. This script prompts
-- once for the two new passwords it needs to create.)

SET SERVEROUTPUT ON
SET ECHO ON
WHENEVER SQLERROR CONTINUE

ALTER SESSION SET CONTAINER = FREEPDB1;

ACCEPT app_pwd CHAR PROMPT 'New password for the MAHAL_APP schema user: ' HIDE
ACCEPT workspace_admin_pwd CHAR PROMPT 'New password for the APEX workspace ADMIN user: ' HIDE

-- 1. Application schema
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM dba_users WHERE username = 'MAHAL_APP';
  IF v_count = 0 THEN
    EXECUTE IMMEDIATE 'CREATE USER mahal_app IDENTIFIED BY "&app_pwd" DEFAULT TABLESPACE users QUOTA UNLIMITED ON users';
  END IF;
END;
/

GRANT CONNECT, RESOURCE TO mahal_app;
GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE VIEW TO mahal_app;

-- 2. REST-enable the schema (base path /ords/mahal/)
BEGIN
  ORDS_ADMIN.ENABLE_SCHEMA(
    p_enabled             => TRUE,
    p_schema              => 'MAHAL_APP',
    p_url_mapping_type    => 'BASE_PATH',
    p_url_mapping_pattern => 'mahal',
    p_auto_rest_auth      => FALSE
  );
  COMMIT;
END;
/

ALTER SESSION SET CURRENT_SCHEMA = MAHAL_APP;

-- 3. Tables (drop-if-exists guards so this script is re-runnable)
BEGIN EXECUTE IMMEDIATE 'DROP TABLE inquiries'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE app_users'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE venues'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

CREATE TABLE venues (
  id            VARCHAR2(20) PRIMARY KEY,
  name          VARCHAR2(200) NOT NULL,
  slug          VARCHAR2(200) UNIQUE NOT NULL,
  category      VARCHAR2(50),
  city          VARCHAR2(100),
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

CREATE TABLE inquiries (
  id          VARCHAR2(20) PRIMARY KEY,
  venue_id    VARCHAR2(20),
  venue_name  VARCHAR2(200),
  name        VARCHAR2(150),
  email       VARCHAR2(200),
  event_type  VARCHAR2(100),
  event_date  VARCHAR2(20),
  guests      NUMBER,
  message     CLOB,
  status      VARCHAR2(20) DEFAULT 'new',
  created_at  TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- 4. APEX workspace for the admin console (Wing A)
BEGIN
  APEX_INSTANCE_ADMIN.ADD_WORKSPACE(
    p_workspace      => 'MAHAL',
    p_primary_schema => 'MAHAL_APP'
  );
  COMMIT;
END;
/

DECLARE
  v_id NUMBER;
BEGIN
  v_id := APEX_UTIL.FIND_SECURITY_GROUP_ID(p_workspace => 'MAHAL');
  APEX_UTIL.SET_SECURITY_GROUP_ID(v_id);
  APEX_UTIL.CREATE_USER(
    p_user_name       => 'ADMIN',
    p_web_password    => '&workspace_admin_pwd',
    p_developer_privs => 'ADMIN:CREATE:DATA_LOADER:EDIT:HELP:MONITOR:SQL',
    p_email_address   => 'admin@mahal.local'
  );
  COMMIT;
END;
/

PROMPT ----------------------------------------------------------------
PROMPT Schema + tables created. AutoREST on each table needs one more
PROMPT step, run AS the mahal_app user (INHERIT PRIVILEGES quirk when
PROMPT enabling REST from a DBA session with CURRENT_SCHEMA switched):
PROMPT
PROMPT   sqlplus mahal_app/<app_pwd>@localhost:1521/FREEPDB1 @enable_rest.sql
PROMPT ----------------------------------------------------------------
EXIT;
