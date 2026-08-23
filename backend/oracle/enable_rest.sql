-- Run as the mahal_app schema owner (see provision.sql's final prompt):
--   sqlplus mahal_app/<app_pwd>@localhost:1521/FREEPDB1 @enable_rest.sql
SET SERVEROUTPUT ON
SET ECHO ON

BEGIN
  ORDS.ENABLE_OBJECT(p_enabled => TRUE, p_schema => 'MAHAL_APP', p_object => 'VENUES',    p_object_type => 'TABLE', p_object_alias => 'venues',    p_auto_rest_auth => FALSE);
  ORDS.ENABLE_OBJECT(p_enabled => TRUE, p_schema => 'MAHAL_APP', p_object => 'APP_USERS', p_object_type => 'TABLE', p_object_alias => 'users',     p_auto_rest_auth => FALSE);
  ORDS.ENABLE_OBJECT(p_enabled => TRUE, p_schema => 'MAHAL_APP', p_object => 'INQUIRIES', p_object_type => 'TABLE', p_object_alias => 'inquiries', p_auto_rest_auth => FALSE);
  COMMIT;
END;
/

PROMPT DONE — tables are now live at http://localhost:8080/ords/mahal/venues/ etc.
EXIT;
