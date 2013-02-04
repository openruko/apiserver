CREATE OR REPLACE FUNCTION restart_instances
(p_app_id integer, p_instance_type_or_name text DEFAULT NULL)
RETURNS integer AS
$BODY$
DECLARE
BEGIN
  
  PERFORM * FROM stop_instances(p_app_id, p_instance_type_or_name::text);
  PERFORM * FROM start_instances(p_app_id, p_instance_type_or_name::text);

  RETURN 1;

END; 
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
