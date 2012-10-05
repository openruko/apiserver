CREATE OR REPLACE FUNCTION update_password
  (p_user_id integer, p_password text)
RETURNS SETOF oruser AS
$BODY$
DECLARE
  v_matched_user oruser%rowtype;
  v_crypt_password text;
BEGIN

  -- internal function only

  SELECT * FROM oruser WHERE 
    oruser.id = p_user_id INTO v_matched_user;

  IF v_matched_user IS NULL THEN
    RAISE EXCEPTION 'No user found';
  ELSE
    v_crypt_password := crypt(p_password,gen_salt('md5'));

    UPDATE oruser SET password_encrypted = crypt_password WHERE 
      oruser.id = p_user_id;
    RETURN QUERY SELECT * FROM oruser WHERE oruser.id = p_user_id;

  END IF;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
