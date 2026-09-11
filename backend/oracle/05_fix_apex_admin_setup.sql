-- 05_fix_apex_admin_setup.sql
-- Two fixes required on top of provision_mahaldb.sql before the MAHALDB
-- REST endpoints and the APEX ADMIN workspace login both work end to end.
-- Discovered 2026-09-11 running against native Oracle 26ai + ORDS (not
-- Docker). Run as SYS AS SYSDBA, connected to the FREEPDB1 pluggable
-- database, AFTER provision_mahaldb.sql and BEFORE enable_rest_mahaldb.sql.
--
-- Replace 'ApexAdmin2026Pwd' below with your own password before running.

-- ---------------------------------------------------------------------
-- Step A -- REST-enable the MAHALDB schema itself.
-- Without this, enable_rest_mahaldb.sql fails with:
--   ORA-20012: Schema not REST enabled : MAHALDB
-- even after ORDS itself is installed and running.
-- ---------------------------------------------------------------------
BEGIN
  ORDS.ENABLE_SCHEMA(
    p_enabled             => TRUE,
    p_schema              => 'MAHALDB',
    p_url_mapping_type    => 'BASE_PATH',
    p_url_mapping_pattern => 'mahaldb',
    p_auto_rest_auth      => FALSE
  );
  COMMIT;
END;
/

-- ---------------------------------------------------------------------
-- Step B -- reset the APEX workspace ADMIN password and grant it
-- developer/admin rights. APEX_UTIL.CREATE_USER (run inside
-- provision_mahaldb.sql) creates the workspace user but does NOT set a
-- usable password or grant any role, so login redirects to a
-- "Restricted End User Access" page until this runs.
-- ---------------------------------------------------------------------
BEGIN
  APEX_UTIL.SET_WORKSPACE(p_workspace => 'MAHALDB');
  APEX_UTIL.EDIT_USER(
    p_user_id                => APEX_UTIL.GET_USER_ID(p_username => 'ADMIN'),
    p_user_name               => 'ADMIN',
    p_web_password             => 'ApexAdmin2026Pwd',
    p_new_password             => 'ApexAdmin2026Pwd',
    p_account_locked           => 'N',
    p_failed_access_attempts   => 0,
    p_developer_roles          => 'ADMIN:CREATE:DATA_LOADER:EDIT:HELP:MONITOR:SQL'
  );
  COMMIT;
END;
/

-- Verify (all three IS_* columns should read Yes):
--   SELECT workspace_name, user_name, is_admin, is_application_developer,
--          is_data_reporter_developer, account_locked
--   FROM   apex_workspace_apex_users
--   WHERE  user_name = 'ADMIN';
