CREATE OR REPLACE FUNCTION create_instance
(p_app_id integer, p_release_id integer, p_name text, p_command text, 
  p_restart boolean DEFAULT false)
RETURNS text AS
$BODY$
DECLARE
  v_existing_process_count integer;
  v_next_count integer;
  v_instance_name text;
  v_instance_id text;
  v_logplex_id uuid;
BEGIN

  SELECT COUNT(id) FROM instance WHERE name LIKE p_name || '.%'
    AND retired = false
    AND app_id = p_app_id
    INTO v_existing_process_count;

  v_next_count = (v_existing_process_count + 1);
  v_instance_name = p_name || '.' || v_next_count;
  

  SELECT id FROM logplex WHERE app_id = p_app_id AND
    channel = 'app' AND source = v_instance_name 
        INTO v_logplex_id;

  IF v_logplex_id IS NULL THEN

    INSERT INTO logplex 
      (app_id, channel, source)
      VALUES (p_app_id, 'app', p_name)
      RETURNING id INTO v_logplex_id;

  END IF;

  INSERT INTO instance 
    (app_id, release_id, name, instance_type, command, logplex_id, retired)
    VALUES (p_app_id, p_release_id, v_instance_name, 
      p_name, p_command, v_logplex_id, false)
    RETURNING id INTO v_instance_id;

  RETURN v_instance_id;
   
END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
