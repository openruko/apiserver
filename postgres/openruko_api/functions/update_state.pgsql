CREATE OR REPLACE FUNCTION update_state
(p_instance_id text, p_dyno_id text, p_state text)
RETURNS integer AS
$BODY$
DECLARE
BEGIN

  INSERT INTO instance_state 
    (state, state_extra_info, transitioned_at, instance_id, dyno_id)
      VALUES (p_state, '', NOW(), p_instance_id, p_dyno_id);

  RETURN 1;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :

