-- 06_unlock_apex_admin.sql
-- Clears the APEX workspace ADMIN account lockout ("The account is locked."
-- on sign-in) and refreshes the password/role grant to a known-good state.
-- Run as SYS AS SYSDBA, connected to the FREEPDB1 pluggable database:
--
--   sqlplus sys/<your-sys-password>@localhost:1522/freepdb1 as sysdba
--   SQL> @"N:\mahal\mahal-v1\backend\oracle\06_unlock_apex_admin.sql"
--
-- Sets the password to NRassem@30 (the one currently in use) so there is
-- no ambiguity about which password is active after this runs.

BEGIN
  APEX_UTIL.SET_WORKSPACE(p_workspace => 'MAHALDB');
  APEX_UTIL.EDIT_USER(
    p_user_id                 => APEX_UTIL.GET_USER_ID(p_username => 'ADMIN'),
    p_user_name                => 'ADMIN',
    p_web_password              => 'NRassem@30',
    p_new_password              => 'NRassem@30',
    p_account_locked            => 'N',
    p_failed_access_attempts    => 0,
    p_developer_roles           => 'ADMIN:CREATE:DATA_LOADER:EDIT:HELP:MONITOR:SQL'
  );
  COMMIT;
END;
/

-- Verify (account_locked should read 'N', is_admin/is_application_developer
-- should read 'Yes'):
SELECT workspace_name, user_name, is_admin, is_application_developer,
       is_data_reporter_developer, account_locked
FROM   apex_workspace_apex_users
WHERE  user_name = 'ADMIN';
