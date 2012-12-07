CREATE OR REPLACE FUNCTION add_config
(p_user_id integer, p_app_id integer, p_env_vars hstore)
RETURNS SETOF release AS
$BODY$
DECLARE
  v_last_release release%rowtype;
  v_existing_env_vars hstore;
  v_new_env_vars hstore;
  v_new_descr text;
  v_user oruser%rowtype;
BEGIN
  
  -- get last release
  SELECT * FROM release WHERE app_id = p_app_id
    ORDER BY id DESC LIMIT 1 INTO v_last_release;

  SELECT * FROM oruser WHERE id = p_user_id INTO v_user;

  v_existing_env_vars := v_last_release.env;

  -- merge the env with those in last release, new take priority
  -- SELECT 'a=>1'::hstore || 'a=>2'::hstore
  v_new_env_vars := coalesce(v_existing_env_vars,  hstore(array[]::varchar[])) || p_env_vars;

  -- friendly message shows new keys add for release description
  v_new_descr := 'Add ' || array_to_string(akeys(p_env_vars),', ');


  -- store the new release, we never overwrite previous releases
  PERFORM create_release(p_app_id, v_user.email, v_new_descr, v_last_release.commit,
    v_last_release.slug_id, v_new_env_vars, v_last_release.pstable, v_last_release.addons);

  RETURN QUERY SELECT * FROM release WHERE app_id = p_app_id
    ORDER BY id DESC LIMIT 1;
  
END; 
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
