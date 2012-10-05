CREATE OR REPLACE FUNCTION get_apps(p_user_id integer)
RETURNS TABLE(name text, owner_email text) AS
$BODY$
DECLARE
BEGIN

  RETURN QUERY SELECT app.name AS name, oruser.email AS owner_email 
      FROM app, oruser, collaborator
        WHERE 
          (app.user_id = oruser.id) AND
         (collaborator.user_id = p_user_id
          AND collaborator.app_id = app.id)
          AND (app.status IS NULL OR app.status <> 'disabled');

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :

