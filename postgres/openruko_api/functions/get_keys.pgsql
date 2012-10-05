CREATE OR REPLACE FUNCTION get_keys(p_user_id integer)
RETURNS SETOF key AS
$BODY$
DECLARE
BEGIN
  RETURN QUERY SELECT * FROM key WHERE key.user_id = p_user_id;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
