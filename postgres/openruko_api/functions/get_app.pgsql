CREATE OR REPLACE FUNCTION get_app(p_app_id integer)
RETURNS SETOF app AS
$BODY$
DECLARE
  v_matched_app app%rowtype;
BEGIN

  SELECT * FROM app WHERE id = p_app_id INTO v_matched_app;

  IF v_matched_app IS NULL THEN
    RAISE EXCEPTION 'App not found.';
  ELSE
    RETURN NEXT v_matched_app;
  END IF;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :

