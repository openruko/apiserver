CREATE OR REPLACE FUNCTION get_current_release(p_app_id integer)
RETURNS SETOF release AS
$BODY$
DECLARE
BEGIN
  RETURN QUERY SELECT * FROM release WHERE app_id = p_app_id
    ORDER BY created_at DESC
    LIMIT 1;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
