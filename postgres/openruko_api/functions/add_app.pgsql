CREATE OR REPLACE FUNCTION add_app
(p_user_id integer, p_name text, p_stack text)
RETURNS SETOF app AS
$BODY$
DECLARE
  v_already_exists boolean;
  v_app_id integer;
  v_base_domain text;
  v_web_url text;
  v_git_url text;
  v_user oruser%ROWTYPE;
BEGIN

  -- generate random name is empty
  IF p_name IS NULL OR p_name = '' THEN
    p_name := md5(random()::text); -- TODO: fancy random names 
  END IF;

  -- set default stack to cedar
  IF p_stack IS NULL OR p_stack = '' THEN
    p_stack := 'cedar';
  END IF;
    
  SELECT * FROM oruser WHERE id = p_user_id INTO v_user;

  SELECT EXISTS(SELECT id FROM app WHERE name = p_name) INTO v_already_exists;

  IF v_already_exists THEN
    RAISE EXCEPTION 'Name is aleady taken.';
  END IF;

  v_base_domain := COALESCE((SELECT value FROM settings WHERE key='base_domain'),'mymachine.me');
  v_web_url := 'http://'::text || p_name::text || '.'::text || v_base_domain::text || '/';
  v_git_url := 'git@'::text || v_base_domain::text || ':'::text || p_name::text || '.git'::text;


  INSERT INTO app (name, user_id, stack, web_url, git_url, create_status, dynos, workers, 
      created_at, slugsize, reposize, buildpack_provided_description)
    VALUES (p_name, p_user_id, p_stack, 
      v_web_url,v_git_url,'created', 0, 0, NOW(),0,0,'') RETURNING id
    INTO v_app_id;

  INSERT INTO collaborator (user_id, app_id, access) 
    VALUES (p_user_id, v_app_id, 'edit');

  INSERT INTO logplex (app_id, channel, source) 
    VALUES (v_app_id, 'heroku', 'router');

  INSERT INTO logplex (app_id, channel, source) 
    VALUES (v_app_id, 'heroku', 'api');

  INSERT INTO release
   (app_id, name, seq_count, descr, commit, env,
      pstable, addons, user_email, created_at)
    VALUEs (v_app_id, 'v1',1, 'Initial release', NULL, ''::hstore,
      ''::hstore, '{}', v_user.email, NOW());

  -- looks hacky but this is done by Heroku, useful to rollback last release.
  INSERT INTO release
   (app_id, name, seq_count, descr, commit, env,
      pstable, addons, user_email, created_at)
    VALUEs (v_app_id, 'v2',2, 'Enable Logplex', NULL, ''::hstore,
      ''::hstore, '{}', v_user.email, NOW());
    
  RETURN QUERY SELECT * FROM app WHERE id = v_app_id;
   
END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
