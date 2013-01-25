CREATE OR REPLACE FUNCTION authenticate_user(p_username text, p_password text)
RETURNS SETOF oruser AS
$BODY$
DECLARE
  v_matched_user oruser%rowtype;
  v_crypt_password text;
BEGIN
  -- username is email
  
  SELECT * FROM oruser WHERE email = p_username AND is_super_user = false INTO v_matched_user;

  IF v_matched_user IS NULL THEN
    RAISE EXCEPTION 'Authentication failed no user';
  END IF;
  
  v_crypt_password := crypt(p_password, v_matched_user.password_encrypted);

  IF v_crypt_password = v_matched_user.password_encrypted THEN
    RETURN NEXT v_matched_user; 
  ELSE
    RAISE EXCEPTION 'Authentication failed bad password';
  END IF;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
