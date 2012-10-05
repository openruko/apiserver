CREATE OR REPLACE FUNCTION authorize_user_by_app_id
  (p_user_id integer, IN p_app_id text)
RETURNS TABLE(app_id integer, access text) AS
$BODY$
DECLARE
  v_matched_app_id integer;
  v_matched_collaborator collaborator%rowtype;
BEGIN

  SELECT * FROM collaborator WHERE collaborator.user_id = p_user_id AND  
    collaborator.app_id = p_app_id INTO v_matched_collaborator;

  IF v_matched_collaborator IS NULL THEN
    RAISE EXCEPTION 'User not authorized';
  ELSE
    RETURN QUERY SELECT v_matched_collaborator.app_id as app_id, 
      EXISTS(SELECT id FROM app WHERE app_id = v_matched_collaborator.app_id
        AND user_id = v_matched_collaborator.user_id) AS is_app_owner,
          v_matched_collaborator.access as access;
  END IF;

END
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :

