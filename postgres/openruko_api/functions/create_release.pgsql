CREATE OR REPLACE FUNCTION create_release
(p_app_id integer,
p_user_email text,
p_descr text,
p_commit text,
p_slug_id text,
p_env hstore,
p_pstable hstore,
p_addons text[])
RETURNS integer AS
$BODY$
DECLARE
  v_last_release release%rowtype;
  v_new_seq_count integer;
  v_new_name text;
  v_required_instances text[];
  v_release_id integer;
BEGIN

  SELECT * FROM release WHERE app_id = p_app_id
    ORDER BY id DESC LIMIT 1 INTO v_last_release;

  v_new_seq_count := (COALESCE(v_last_release.seq_count,0)+ 1);
  v_new_name := 'v' || v_new_seq_count::text;

  INSERT INTO release
    (descr, commit, slug_id, app_id, env, pstable, addons,
      seq_count, name, user_email, created_at)
    VALUES (p_descr, p_commit, p_slug_id, p_app_id, p_env, p_pstable,
      p_addons, v_new_seq_count, v_new_name,
      p_user_email, NOW())
      RETURNING id INTO v_release_id;

  CREATE TEMP TABLE bad_instances ON COMMIT DROP AS
    SELECT * FROM boss_instance WHERE
      app_id = p_app_id AND
      instance_type NOT IN (SELECT * FROM unnest(akeys(p_pstable)));

  UPDATE instance SET retired = false WHERE id IN
      (SELECT id FROM bad_instances);

  v_required_instances = ARRAY(SELECT * FROM unnest(akeys(p_pstable)) proc_type
        WHERE proc_type NOT IN (SELECT instance_type FROM boss_instance
          WHERE app_id = p_app_id));

  PERFORM create_instance(p_app_id, v_release_id, a_instance_type,
    p_pstable->a_instance_Type) FROM unnest(v_required_instances)
      a_instance_type;

  PERFORM restart_instances(p_app_id, null);

  RETURN 2;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
