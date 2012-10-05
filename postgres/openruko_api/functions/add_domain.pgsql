CREATE OR REPLACE FUNCTION add_domain
(p_app_id integer, p_domain_name text)
  RETURNS SETOF domain AS
$BODY$
DECLARE
  v_base_domain text;
  v_domain_id integer;
BEGIN
  
  v_base_domain := substring(p_domain_name FROM '(?:\.(.*$))');

  INSERT INTO domain 
    (domain, base_domain, app_id, created_at)
    VALUES
    (p_domain_name, v_base_domain, p_app_id, NOW())
    RETURNING id INTO v_domain_id;

  RETURN QUERY SELECT * FROM domain WHERE id = v_domain_id;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
