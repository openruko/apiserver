CREATE OR REPLACE FUNCTION delete_domain
(p_app_id integer, p_domain_name text)
  RETURNS SETOF domain AS
$BODY$
DECLARE
BEGIN
  
  DELETE FROM domain WHERE app_id = p_app_id AND
    domain ILIKE p_domain_name;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Domain not found.';
  ELSE
    RETURN QUERY SELECT * FROM domain WHERE app_id = p_app_id;
  END IF;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
