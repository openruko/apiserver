CREATE OR REPLACE FUNCTION get_all_addons()
RETURNS TABLE(name text, description text, url text, state text,
              price_cents integer, price_unit text, group_description text) AS
$BODY$
DECLARE
BEGIN

  RETURN QUERY SELECT a.name || ':' || p.name AS name,
                      p.description,
                      a.url,
                      a.state,
                      p.price_cents,
                      p.price_unit,
                      a.description AS group_description
                 FROM addon as a, addon_plan as p
                WHERE a.id = p.addon_id;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
