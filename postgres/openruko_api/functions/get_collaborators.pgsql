CREATE OR REPLACE FUNCTION get_collaborators(p_app_id integer)
RETURNS TABLE(name text, email text, access text) AS
$BODY$
DECLARE
BEGIN
  RETURN QUERY SELECT null::text as name, oruser.email AS email, 'edit'::text AS access
    FROM collaborator, oruser WHERE  collaborator.user_id = oruser.id 
      AND collaborator.app_id = p_app_id;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
