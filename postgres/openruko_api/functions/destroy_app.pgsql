CREATE OR REPLACE FUNCTION destroy_app
  (p_app_id integer)
  RETURNS SETOF integer AS
$BODY$
DECLARE
  v_current_instances uuid[];
BEGIN

  UPDATE app SET status = 'disabled' WHERE id = p_app_id;

  v_current_instances := ARRAY(SELECT id FROM instance WHERE app_id = p_app_id);

  INSERT INTO job (job_name, job_payload) 
    SELECT 'kill_instance' AS job_name, row_to_json(i.*) 
      AS job_payload FROM (SELECT instance_id FROM 
        unnest(v_current_instances) instance_id) i;

  RETURN QUERY SELECT 1 as affected_apps;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
