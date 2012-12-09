CREATE OR REPLACE FUNCTION update_state
(p_instance_id text, p_dyno_id text, p_state text, p_port integer)
RETURNS integer AS
$BODY$
DECLARE
BEGIN

  INSERT INTO instance_state 
    (state, state_extra_info, transitioned_at, instance_id, dyno_id)
      VALUES (p_state, '', NOW(), p_instance_id, p_dyno_id);
 
  IF (p_state = 'completed' OR p_state = 'errored') THEN
    UPDATE instance SET retired = true
      WHERE id = p_instance_id;
  END IF;

  IF (p_state = 'running') THEN
    UPDATE instance SET port = p_port
      WHERE id = p_instance_id;
  END IF;

  RETURN 1;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :

