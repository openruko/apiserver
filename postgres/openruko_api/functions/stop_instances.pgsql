CREATE OR REPLACE FUNCTION stop_instances
  (p_app_id integer, p_type text)
RETURNS integer AS 
$BODY$
DECLARE
  v_instance instance%rowtype;
BEGIN

  FOR v_instance IN SELECT * FROM instance 
    WHERE instance.app_id = p_app_id AND NOT instance.retired 
  LOOP

    UPDATE provision_job 
      SET next_action='kill', kill_method = 'explicit'
      WHERE instance_id = v_instance.id;

    -- dont really need a loop here, leave for now 

  END LOOP;
  
  RETURN 1;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
