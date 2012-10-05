CREATE OR REPLACE FUNCTION remove_config
  (p_user_id integer, p_app_id integer, key_to_remove text)
RETURNS SETOF release AS
$BODY$
DECLARE
  v_last_release release%rowtype;
  v_existing_env_vars hstore;
  v_new_env_vars hstore;
  v_new_descr text;
  v_new_name text;
  v_release_id integer;
  v_new_seq_count integer;
  v_user oruser%rowtype;
BEGIN
  
  -- get last release
  SELECT * FROM release WHERE app_id = p_app_id
    ORDER BY id DESC LIMIT 1 INTO v_last_release;

  SELECT * FROM oruser WHERE id = p_user_id INTO v_user;

  v_existing_env_vars := v_last_release.env;

  -- delete key from new vars
  v_new_env_vars := delete(coalesce(v_existing_env_vars::hstore,
     hstore(array[]::varchar[])), key_to_remove);

  -- friendly message shows new keys add for release description
  v_new_descr := 'Remove ' || key_to_remove::text;

  v_new_seq_count := (v_last_release.seq_count + 1);
  v_new_name := 'v' || v_new_seq_count::text;

  -- store the new release, we never overwrite previous releases
  INSERT INTO release
    (app_id, name, seq_count, descr, commit, env, pstable, addons,
      user_email, created_at)
    VALUES (p_app_id, v_new_name, v_new_seq_count, v_new_descr, 
      v_last_release.commit, v_new_env_vars, v_last_release.pstable, 
      v_last_release.addons, v_user.email, NOW())
       RETURNING id INTO v_release_id;

  PERFORM * FROM restart_instances(p_app_id, NULL::text);

  RETURN QUERY SELECT * FROM release WHERE id = v_release_id;
  
END; 
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
