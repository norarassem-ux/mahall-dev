-- Run as the mahaldb schema owner (see provision_mahaldb.sql's final prompt):
--   sqlplus mahaldb/<app_pwd>@localhost:1521/FREEPDB1 @enable_rest_mahaldb.sql
SET SERVEROUTPUT ON
SET ECHO ON

BEGIN
  ORDS.ENABLE_OBJECT(p_enabled => TRUE, p_schema => 'MAHALDB', p_object => 'VENUES_FLAT', p_object_type => 'VIEW',  p_object_alias => 'venues',    p_auto_rest_auth => FALSE);
  ORDS.ENABLE_OBJECT(p_enabled => TRUE, p_schema => 'MAHALDB', p_object => 'APP_USERS',   p_object_type => 'TABLE', p_object_alias => 'users',     p_auto_rest_auth => FALSE);
  ORDS.ENABLE_OBJECT(p_enabled => TRUE, p_schema => 'MAHALDB', p_object => 'INQUIRIES',   p_object_type => 'TABLE', p_object_alias => 'inquiries', p_auto_rest_auth => FALSE);
  COMMIT;
END;
/

-- venues/ (AutoREST, above) only serves GET reliably — see the comment on
-- venues_flat_insert in provision_mahaldb.sql for why POST there 500s.
-- This custom handler is the real write path the Node backend uses.
BEGIN
  ORDS.DEFINE_MODULE(
    p_module_name    => 'mahaldb.venue.create',
    p_base_path      => '/venue-create/',
    p_items_per_page => 0,
    p_status         => 'PUBLISHED'
  );

  ORDS.DEFINE_TEMPLATE(
    p_module_name => 'mahaldb.venue.create',
    p_pattern     => '/'
  );

  ORDS.DEFINE_HANDLER(
    p_module_name => 'mahaldb.venue.create',
    p_pattern     => '/',
    p_method      => 'POST',
    p_source_type => ORDS.source_type_plsql,
    p_source      => q'[
DECLARE
  v_city_id     NUMBER;
  v_category_id NUMBER;
BEGIN
  BEGIN
    SELECT city_id INTO v_city_id FROM cities WHERE city_name = :city;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      INSERT INTO cities (city_name) VALUES (:city) RETURNING city_id INTO v_city_id;
  END;

  SELECT category_id INTO v_category_id FROM categories WHERE slug = :category;

  INSERT INTO venues (
    id, name, slug, category_id, city_id, area, capacity, price_from, amenities,
    rating, reviews_count, host_name, host_email, host_phone, description, status, featured, owner_id, image_url
  ) VALUES (
    :id, :name, :slug, v_category_id, v_city_id, :area, :capacity, :price_from, :amenities,
    0, 0, :host_name, :host_email, :host_phone, :description, NVL(:status, 'live'), NVL(:featured, 0), :owner_id, :image_url
  );
  COMMIT;
END;
]'
  );

  COMMIT;
END;
/

PROMPT DONE — reads at http://localhost:8080/ords/mahaldb/venues/, writes at /venue-create/
EXIT;
