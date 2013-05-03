CREATE OR REPLACE FUNCTION remove_addon
(p_user_id integer, p_app_id integer, p_addon_name text)
RETURNS SETOF release AS
$BODY$
DECLARE
  v_array_temp text[];
  v_addon_name text;
  v_addon_plan text;
  v_addon_id integer;
  v_addon_plan_id integer;
  v_key_to_remove text;
  v_new_addons text[];
  v_last_release release%rowtype;
  v_existing_env_vars hstore;
  v_new_env_vars hstore;
  v_new_descr text;
  v_user oruser%rowtype;
  v_already_exists boolean;
BEGIN

  v_array_temp = string_to_array(p_addon_name, ':');
  v_addon_name = v_array_temp[1];
  v_addon_plan = v_array_temp[2];

  -- check if addon and addon_plan exists
  SELECT a.id, p.id
    FROM addon a, addon_plan p
   WHERE a.name = v_addon_name
     AND p.name = v_addon_plan
     AND a.id = p.addon_id
    INTO v_addon_id, v_addon_plan_id;

  IF v_addon_id IS NULL THEN
    RAISE EXCEPTION 'Addon not found.';
  END IF;

  -- check if app already have this addon installed
  SELECT EXISTS(
    SELECT id FROM app_addon
     WHERE app_id = p_app_id
       AND addon_id = v_addon_id
       AND plan_id = v_addon_plan_id)
    INTO v_already_exists;

  IF NOT v_already_exists THEN
    RAISE EXCEPTION 'Addon not installed.';
  END IF;

  -- get key from addon
  SELECT config_vars from addon WHERE name = v_addon_name
    INTO v_key_to_remove;

  -- get last release
  SELECT * FROM release WHERE app_id = p_app_id
    ORDER BY id DESC LIMIT 1 INTO v_last_release;

  v_existing_env_vars := v_last_release.env;

  -- delete key from new vars
  v_new_env_vars := delete(coalesce(v_existing_env_vars::hstore,
     hstore(array[]::varchar[])), v_key_to_remove);

  -- delete add-on from app_addon
  DELETE FROM app_addon
   WHERE app_id = p_app_id
     AND addon_id = v_addon_id
     AND plan_id = v_addon_plan_id;

  -- aggregate installed addons as array
  SELECT array_agg(installed_addons.name) FROM
    (SELECT a.name || ':' || p.name AS name
       FROM app_addon aa, addon a, addon_plan p
      WHERE aa.app_id = p_app_id
        AND aa.addon_id = a.id
        AND aa.plan_id = p.id) AS installed_addons
    INTO v_new_addons;

  v_new_descr := 'Remove ' || p_addon_name || ' add-on';

  SELECT * FROM oruser WHERE id = p_user_id INTO v_user;

  -- store the new release, we never overwrite previous releases
  PERFORM create_release(p_app_id, v_user.email, v_new_descr, v_last_release.commit,
    v_last_release.slug_id, v_new_env_vars, v_last_release.pstable, v_new_addons);

  RETURN QUERY SELECT * FROM release WHERE app_id = p_app_id
    ORDER BY id DESC LIMIT 1;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
