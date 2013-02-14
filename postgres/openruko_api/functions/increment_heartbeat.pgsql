CREATE OR REPLACE FUNCTION increment_heartbeat(p_instance_id text)
RETURNS SETOF integer AS
$BODY$
DECLARE
  v_heartbeats integer;
  v_app_id integer;
BEGIN

  SELECT app_id FROM instance WHERE id = p_instance_id
    LIMIT 1
      INTO v_app_id;

  SELECT heartbeats FROM app WHERE id = v_app_id
    LIMIT 1
      INTO v_heartbeats;

  IF v_heartbeats IS NOT null THEN
    UPDATE app
      SET heartbeats = heartbeats + 1
    WHERE id = v_app_id;
  ELSE
    UPDATE app
      SET heartbeats = 1
    WHERE id = v_app_id;
  END IF;

  RETURN QUERY SELECT app.heartbeats FROM app WHERE id = v_app_id;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :

