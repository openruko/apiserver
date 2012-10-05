CREATE OR REPLACE FUNCTION get_config(p_app_id integer)
RETURNS TABLE(env hstore) AS
$BODY$
DECLARE
BEGIN
  
  RETURN QUERY SELECT release.env FROM release WHERE app_id = p_app_id
    ORDER BY id DESC LIMIT 1;

END; 
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
