CREATE OR REPLACE FUNCTION get_addons(p_app_id integer)
RETURNS SETOF addon AS
$BODY$
DECLARE
BEGIN
  RETURN QUERY SELECT * FROM addon WHERE app_id = p_app_id;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
