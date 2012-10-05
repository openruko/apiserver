CREATE OR REPLACE FUNCTION get_logplex_map(p_app_id integer)
RETURNS SETOF logplex AS
$BODY$
DECLARE
BEGIN

  RETURN QUERY SELECT * FROM logplex WHERE app_id = p_app_id;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :

