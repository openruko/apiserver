CREATE OR REPLACE FUNCTION authenticate_user_by_api_key(p_api_key text)
RETURNS SETOF oruser AS
$BODY$
DECLARE
  v_matched_user oruser%rowtype;
BEGIN

  SELECT * FROM oruser WHERE api_key = p_api_key INTO v_matched_user;

  IF v_matched_user IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN NEXT v_matched_user; 

END; 
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
