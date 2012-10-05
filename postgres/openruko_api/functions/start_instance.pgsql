CREATE OR REPLACE FUNCTION start_instance
(p_app_id integer, p_instance_id text)
RETURNS integer AS 
$BODY$
DECLARE
  v_instance instance%rowtype;
  v_release release%rowtype;
  v_command_arg_parts text[];
  v_command_args text[];
  v_command text;
  v_dyno_id text;
  v_mounts hstore;
  v_bucket text;
  v_c text[];
BEGIN


  SELECT * FROM instance WHERE instance.id = p_instance_id LIMIT 1 INTO v_instance;

  v_c = array(SELECT id FROM instance);


  IF v_instance IS NULL THEN
    RAISE EXCEPTION  'hit with inst  searching: %, needles: %', p_instance_id, v_c;
  END IF;

  v_bucket = (SELECT value FROM settings WHERE key = 's3bucket');
  v_release = get_current_release(v_instance.app_id);

  v_dyno_id = generate_uuid();

  INSERT INTO instance_state
    (state, state_extra_info, transitioned_at, instance_id, dyno_id)
    VALUES ('creating', '', NOW(), v_instance.id, v_dyno_id);

  v_command_arg_parts = regexp_split_to_array(v_instance.command, E'\\s+');
  v_command =  v_command_arg_parts[1];
  v_command_args = v_command_arg_parts[2:200];

  v_mounts = hstore('/app', 's3get://' || v_bucket || '/slugs/' || p_app_id || 
    '_' || v_release.slug_id || '.tgz');

  INSERT INTO provision_job 
    (template, name, dyno_id, rez_id, env_vars, attached, pty, command,
      instance_id,
      command_args, logplex_id, mounts, created_at, next_action)
    VALUES 
    ('dyno', v_instance.name, v_dyno_id, null, v_release.env,
      false, false, v_command, v_instance.id,
      v_command_args, v_instance.logplex_id, 
      v_mounts, NOW(), 'start');

  RETURN 1;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
