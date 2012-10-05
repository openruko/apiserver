CREATE OR REPLACE FUNCTION remove_key
(p_user_id integer, p_key_needle text)
RETURNS SETOF integer AS
$BODY$
DECLARE
  v_affected_count integer;
BEGIN

  --heroku search both key note and key start with starts-with like search
  DELETE FROM key WHERE user_id = p_user_id AND 
    (key_key ILIKE  (p_key_needle || '%') OR 
    key_note ILIKE (p_key_needle || '%'));
  
  GET DIAGNOSTICS v_affected_count = ROW_COUNT;

  RAISE INFO '%d', v_affected_count;

  IF v_affected_count > 0 THEN
    RETURN QUERY SELECT v_affected_count AS affected;
  ELSE
    RAISE EXCEPTION 'Key not found %d', v_affected_count;
  END IF;

END; 
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
