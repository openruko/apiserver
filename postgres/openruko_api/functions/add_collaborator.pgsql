CREATE OR REPLACE FUNCTION add_collaborator
(p_app_id integer, p_inviter_user_id integer, p_email text)
-- TODP p_inviter_user_id is not used
RETURNS TABLE(name text, email text, access text) AS
$BODY$
DECLARE
  v_matched_user oruser%rowtype;
BEGIN

  SELECT * FROM oruser WHERE oruser.email = p_email INTO v_matched_user;

  IF v_matched_user IS NULL THEN
    RAISE EXCEPTION 'No user with such email';
  END IF;

  INSERT INTO collaborator (user_id, app_id) 
    SELECT v_matched_user.id, p_app_id
      WHERE NOT EXISTS(SELECT 1 FROM collaborator WHERE 
          collaborator.user_id = v_matched_user.id
            AND collaborator.app_id = p_app_id);

  RETURN QUERY SELECT NULL::text as name, v_matched_user.email AS email,
      'edit'::text AS access;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
