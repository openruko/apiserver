CREATE OR REPLACE FUNCTION remove_collaborator
(p_app_id integer, p_email text)
RETURNS TABLE(app_id integer, email text, result text) AS
$BODY$
DECLARE
BEGIN

    PERFORM 1 FROM app INNER JOIN
        oruser ON oruser.id = app.user_id
        WHERE oruser.email = p_email AND app.id = app_id;

    IF found THEN
      RAISE EXCEPTION 'Can not remove app owner';
    END IF;
    
    DELETE FROM collaborator WHERE collaborator.app_id = p_app_id 
      AND collaborator.user_id IN (SELECT id FROM oruser
        WHERE oruser.email = p_email);

    IF found THEN
      RETURN QUERY SELECT p_app_id::integer AS app_id, 
        p_email::text as email, 'deleted'::text;
    ELSE
      RAISE EXCEPTION 'User or app not found.';
    END IF;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
