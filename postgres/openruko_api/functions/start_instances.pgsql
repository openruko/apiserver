CREATE OR REPLACE FUNCTION start_instances
(p_app_id integer, p_type text)
RETURNS integer AS 
$BODY$
DECLARE
  v_release release%rowtype;
  v_dyno_id text;
  v_bucket text;
  v_mounts hstore;
  v_command_arg_parts text[];
  v_command text;
  v_command_args text[];
  v_instance instance%rowtype;
BEGIN

  v_release = get_current_release(p_app_id);
  v_bucket = (SELECT value FROM settings WHERE key = 's3bucket');

  FOR v_instance IN SELECT * FROM instance 
    WHERE instance.app_id = p_app_id AND NOT instance.retired 
  LOOP

      PERFORM start_instance(p_app_id, v_instance.id);

  END LOOP;
  
  RETURN 1;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
