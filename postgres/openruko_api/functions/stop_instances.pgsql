CREATE OR REPLACE FUNCTION stop_instances
  (p_app_id integer, p_type text)
-- p_type not used
RETURNS integer AS
$BODY$
DECLARE
  v_instance instance%rowtype;
BEGIN

  FOR v_instance IN SELECT * FROM instance
    WHERE instance.app_id = p_app_id AND NOT instance.retired
  LOOP

    PERFORM stop_instance(p_app_id, v_instance.id);

  END LOOP;

  RETURN 1;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
