CREATE OR REPLACE FUNCTION add_user
(p_email text, p_name text, p_password text, 
p_is_super_user boolean DEFAULT false,
p_api_key text DEFAULT generate_uuid()::text)
RETURNS SETOF oruser AS
$BODY$
DECLARE
  v_crypt_password text;
  v_user_id integer;
  v_already_exists boolean;
BEGIN

  SELECT EXISTS(SELECT id FROM oruser WHERE email = p_email) INTO v_already_exists;

  IF v_already_exists THEN
    RAISE EXCEPTION 'Sorry, a user with that email address already exists or the email was invalid.';
  END IF;

  v_crypt_password := crypt(p_password,gen_salt('md5'));

  INSERT INTO oruser
    (email, password_encrypted, name, created_at,
      last_login, api_key, is_super_user, verified, confirmed)
  VALUES (
    p_email, v_crypt_password, p_name, NOW(), NOW(),
    p_api_key, p_is_super_user, true, true) 
    RETURNING id INTO v_user_id;


  RETURN QUERY SELECT * FROM oruser WHERE id = v_user_id;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
