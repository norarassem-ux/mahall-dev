-- Creates a real admin account for the mahal-v1 React/Node app (table
-- mahaldb.app_users, role='admin'). This is deliberately NOT reachable
-- through POST /api/auth/register (that endpoint only ever assigns
-- 'owner' or 'client') -- an admin account has to be created directly
-- in the DB, which is what this script does.
--
-- Login: admin@mahal.city / MahalAdmin2026!
-- (password_hash below is bcryptjs.hashSync('MahalAdmin2026!', 10) --
-- generated once in Node, not something SQL can compute itself)
--
-- Safe to re-run: skips the insert if the email already exists.
SET DEFINE OFF
SET ECHO ON
WHENEVER SQLERROR EXIT FAILURE

ALTER SESSION SET CONTAINER = FREEPDB1;
SET SERVEROUTPUT ON

DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM mahaldb.app_users WHERE email = 'admin@mahal.city';
  IF v_count = 0 THEN
    INSERT INTO mahaldb.app_users (id, email, name, role, password_hash)
    VALUES (
      'admin001',
      'admin@mahal.city',
      'Mahal Admin',
      'admin',
      '$2a$10$Cssy.vkDIPT.qeQp0ES8KOxq5Yi/k9M5Fw2JA8suTzReTjSURuEY.'
    );
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Admin user created.');
  ELSE
    DBMS_OUTPUT.PUT_LINE('admin@mahal.city already exists -- no change made.');
  END IF;
END;
/

SELECT id, email, name, role FROM mahaldb.app_users WHERE email = 'admin@mahal.city';

prompt ...done
