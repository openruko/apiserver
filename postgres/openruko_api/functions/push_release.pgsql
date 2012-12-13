CREATE OR REPLACE FUNCTION push_release
(p_user_id integer, p_app_id integer, p_user_email text, p_commit text, 
p_slug_id text, p_env_vars hstore, p_pstable hstore)
-- TODO p_user_id not used
RETURNS SETOF release AS
$BODY$
DECLARE
  v_last_release release%rowtype;
  v_new_addons text[];
  v_new_env hstore;
BEGIN

  SELECT * FROM release WHERE app_id = p_app_id
    ORDER BY id DESC LIMIT 1 INTO v_last_release;

  v_new_addons = '{}'::text[];

  IF v_last_release.commit IS NULL THEN

    v_new_env = coalesce(v_last_release.env,  hstore(array[]::varchar[])) || p_env_vars;

    PERFORM create_release(p_app_id, p_user_email, ('Deploy ' || 
      substring(p_commit from 1 for 6)), p_commit, p_slug_id,
      v_new_env, p_pstable, v_new_addons);

  ELSE

    PERFORM create_release(p_app_id, p_user_email, ('Deploy ' || 
      substring(p_commit from 1 for 6)),  p_commit, p_slug_id,
      v_last_release.env, p_pstable, v_last_release.addons);

  END IF;

  RETURN QUERY SELECT * FROM release WHERE app_id = p_app_id
    ORDER BY id DESC LIMIT 1;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
