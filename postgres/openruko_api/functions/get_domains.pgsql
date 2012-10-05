CREATE OR REPLACE FUNCTION get_domains(p_app_id integer)
  RETURNS SETOF domain AS
$BODY$
DECLARE
BEGIN
  RETURN QUERY SELECT * FROM domain WHERE app_id = p_app_id;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
