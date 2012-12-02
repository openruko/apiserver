CREATE OR REPLACE FUNCTION stop_instance
(p_app_id integer, p_instance_id text)
RETURNS integer AS 
$BODY$
DECLARE
BEGIN

  UPDATE instance SET retired = true
    WHERE id = p_instance_id;

  UPDATE provision_job 
    SET next_action='kill', kill_method = 'explicit'
    WHERE instance_id = p_instance_id;

  RETURN 1;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
