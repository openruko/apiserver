CREATE OR REPLACE FUNCTION add_provider_addon
(p_user_id integer, p_addon_id text, p_config_vars text,
 p_password text, p_sso_salt text, p_url text, p_sso_url text)
RETURNS SETOF integer AS
$BODY$
DECLARE
  v_user_exists boolean;
  v_already_exists boolean;
  v_addon_id integer;
BEGIN

  IF p_addon_id IS NULL OR p_addon_id = '' THEN
    RAISE EXCEPTION 'Addon id cannot be empty.';
  END IF;

  SELECT EXISTS(SELECT id FROM oruser WHERE id = p_user_id) INTO v_user_exists;
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'Invalid user id.';
  END IF;

  SELECT EXISTS(SELECT id FROM addon WHERE addon_id = p_addon_id) INTO v_already_exists;
  IF v_already_exists THEN
    RAISE EXCEPTION 'Addon id is already taken.';
  END IF;

  INSERT INTO addon (addon_id, user_id, config_vars,
                       password, sso_salt, url,
                       sso_url, state, description)
    VALUES (p_addon_id, p_user_id, p_config_vars,
            p_password, p_sso_salt, p_url,
            p_sso_url, 'beta', p_addon_id) RETURNING id
    INTO    v_addon_id;

  INSERT INTO addon_plan (addon_id, plan_id, description)
    VALUES (v_addon_id, 'test', 'Test plan');

  RETURN QUERY SELECT 1 as affected;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
