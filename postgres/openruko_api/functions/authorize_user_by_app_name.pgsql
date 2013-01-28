CREATE OR REPLACE FUNCTION authorize_user_by_app_name
  (p_user_id integer, IN p_app_name text)
RETURNS TABLE(app_id integer, is_app_owner boolean, access text) AS
$BODY$
DECLARE
  v_matched_app_id integer;
  v_matched_collaborator collaborator%rowtype;
  v_user oruser%rowtype;
BEGIN


  SELECT * FROM oruser WHERE id = p_user_id LIMIT 1 INTO v_user;

  v_matched_app_id := (SELECT id FROM app WHERE app.name = p_app_name);

  IF v_matched_app_id IS NULL THEN
    RAISE EXCEPTION 'App not found.';
  END IF;

  IF v_user.is_super_user THEN
    RETURN QUERY SELECT v_matched_app_id AS app_id, 
      false AS is_app_owner, 'edit'::text AS access;
  ELSE 
    SELECT * FROM collaborator WHERE collaborator.user_id = p_user_id AND  
      collaborator.app_id = v_matched_app_id INTO v_matched_collaborator;

    IF v_matched_collaborator IS NULL THEN
      RAISE EXCEPTION 'User not authorized';
    ELSE
      RETURN QUERY SELECT v_matched_collaborator.app_id as app_id, 
        EXISTS(SELECT 1 FROM app WHERE app.id = v_matched_collaborator.app_id
          AND app.user_id = v_matched_collaborator.user_id) AS is_app_owner,
            v_matched_collaborator.access as access;
    END IF;
  END IF;

END
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :

