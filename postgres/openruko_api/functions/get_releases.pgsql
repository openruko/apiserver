CREATE OR REPLACE FUNCTION get_releases(p_app_id integer)
RETURNS SETOF release AS
$BODY$
DECLARE
BEGIN
  RETURN QUERY SELECT * FROM release WHERE app_id = p_app_id;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
