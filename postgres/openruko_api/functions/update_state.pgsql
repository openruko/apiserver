CREATE OR REPLACE FUNCTION update_state
(p_instance_id text, p_dyno_id text, p_dyno_hostname text, p_state text, p_port integer DEFAULT NULL)
RETURNS integer AS
$BODY$
DECLARE
BEGIN

  INSERT INTO instance_state 
    (state, state_extra_info, transitioned_at, instance_id, dyno_id, dyno_hostname)
      VALUES (p_state, '', NOW(), p_instance_id, p_dyno_id, p_dyno_hostname);
 
  IF (p_state = 'running') THEN
    UPDATE instance SET port = p_port
      WHERE id = p_instance_id;
  END IF;

  RETURN 1;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :

