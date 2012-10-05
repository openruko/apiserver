CREATE OR REPLACE FUNCTION get_user
(p_user_id integer)
RETURNS SETOF oruser AS
$BODY$
DECLARE
BEGIN
  RETURN QUERY SELECT * FROM oruser WHERE id = p_user_id;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
