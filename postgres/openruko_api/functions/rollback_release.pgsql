CREATE OR REPLACE FUNCTION rollback_release(p_app_id integer, 
p_user_email text, p_release_id text)
RETURNS SETOF release AS
$BODY$
DECLARE
  v_old_release release%rowtype;
  v_descr text;
BEGIN

  IF p_release_id = 'last' THEN
    SELECT * FROM release WHERE app_id = p_app_id 
      AND commit IS NOT NULL
      ORDER BY created_at DESC LIMIT 1 OFFSET 1 
        INTO v_old_release;

  ELSE
    SELECT * FROM release WHERE app_id = p_app_id 
      AND name = p_release_id AND commit IS NOT NULL INTO v_old_release;
  END IF;

  IF v_old_release IS NULL THEN
    RAISE EXCEPTION 'Can not rollback to release without commit.';
  END IF;

  v_descr = 'Rollback to v'::text  || v_old_release.seq_count::text;

  PERFORM * FROM create_release(p_app_id, p_user_email, v_descr,
    v_old_release.commit, v_old_release.slug_id, v_old_release.env,
    v_old_release.pstable, v_old_release.addons);

  RETURN QUERY SELECT * FROM get_current_release(p_app_id);


END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
