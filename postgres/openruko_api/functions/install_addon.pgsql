CREATE OR REPLACE FUNCTION install_addon
(p_user_id integer, p_app_id integer, p_addon_name text, p_env_vars hstore)
RETURNS SETOF release AS
$BODY$
DECLARE
  v_array_temp text[];
  v_addon_name text;
  v_addon_plan text;
  v_new_addons text[];
  v_last_release release%rowtype;
  v_existing_env_vars hstore;
  v_new_env_vars hstore;
  v_new_descr text;
  v_user oruser%rowtype;
BEGIN

  v_array_temp = string_to_array(p_addon_name, ':');
  v_addon_name = v_array_temp[1];
  v_addon_plan = v_array_temp[2];

  -- get last release
  SELECT * FROM release WHERE app_id = p_app_id
    ORDER BY id DESC LIMIT 1 INTO v_last_release;

  v_existing_env_vars := v_last_release.env;
  -- merge the env with those in last release, new take priority
  v_new_env_vars := coalesce(v_existing_env_vars,  hstore(array[]::varchar[])) || p_env_vars;

  v_new_descr := 'Add add-on ' || p_addon_name;

  -- add addon name to new release
  v_new_addons := array_append(v_last_release.addons, v_addon_name);

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
