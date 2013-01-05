CREATE OR REPLACE FUNCTION handle_git_command
(p_app_id integer, p_app_name text, p_api_key text, p_command text, p_command_args text[])
RETURNS SETOF provision_job AS 
$BODY$
DECLARE
  v_mounts hstore;
  v_env_vars hstore;
  v_dyno_id text;
  v_bucket text;
  v_epoch text;
  v_rez_id text;
  v_job_id integer;
  v_base_host text;
  v_base_protocol text;
  v_app app%rowtype;
BEGIN

  
  SELECT * FROM app WHERE id = p_app_id LIMIT 1 INTO v_app;

  v_bucket = '{{S3_BUCKET}}';

  v_base_host = '{{BASE_HOST}}';
  
  v_base_protocol = '{{BASE_PROTOCOL}}';

  v_mounts = hstore('/app','s3get://' || v_bucket || '/repos/' || p_app_id || '.tgz');

  v_mounts = v_mounts || hstore('/tmp/buildpacks','file://buildpacks.tgz');

  v_dyno_id = generate_uuid();
  v_rez_id = generate_uuid();

  v_env_vars = hstore('repo_put_url', 's3put://' || v_bucket || '/repos/' || p_app_id || '.tgz');

  v_epoch = (SELECT EXTRACT(EPOCH FROM NOW()))::text;
  
  v_env_vars = v_env_vars || hstore('slug_id', v_epoch);

  v_env_vars = v_env_vars || hstore('dyno_web_url', v_app.web_url);
  
  v_env_vars = v_env_vars || hstore('slug_put_url', 's3put://' || v_bucket || '/slugs/' || p_app_id || 
    '_' || v_epoch || '.tgz');

  v_env_vars = v_env_vars || hstore('push_code_url', v_base_protocol || '://:' ||
    p_api_key || '@' || v_base_host || '/internal/' || p_app_name || '/pushcode');

  INSERT INTO provision_job 
    (template, name, dyno_id, rez_id, env_vars, attached, pty, 
      command, command_args, mounts, created_at, next_action)
    VALUES ('build','build',
    v_dyno_id, v_rez_id,
    v_env_vars, true, 
    false, p_command,
    p_command_args, v_mounts, NOW(), 'start')
    RETURNING id INTO v_job_id;

  RETURN QUERY SELECT * FROM provision_job WHERE id = v_job_id LIMIT 1;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
