CREATE OR REPLACE FUNCTION get_release(p_app_id integer, p_release_id text)
RETURNS SETOF release AS
$BODY$
DECLARE
BEGIN
  RETURN QUERY SELECT * FROM release WHERE app_id = p_app_id
    AND name = p_release_id;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
