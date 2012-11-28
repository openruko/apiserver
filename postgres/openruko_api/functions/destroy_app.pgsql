CREATE OR REPLACE FUNCTION destroy_app
  (p_app_id integer)
  RETURNS integer AS
$BODY$
DECLARE
  v_current_instances uuid[];
BEGIN

  UPDATE app SET status = 'disabled' WHERE id = p_app_id;

  v_current_instances := ARRAY(SELECT id FROM instance WHERE app_id = p_app_id);

  PERFORM * FROM stop_instances(p_app_id, null);

  RETURN 1;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
