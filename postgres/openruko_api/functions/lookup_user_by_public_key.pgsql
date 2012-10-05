CREATE OR REPLACE FUNCTION lookup_user_by_public_Key
(p_fingerprint text)
RETURNS SETOF oruser AS
$BODY$
DECLARE
  v_user_id integer;
BEGIN

  SELECT oruser.id FROM oruser 
    INNER JOIN key ON oruser.id = key.user_id
      WHERE key.key_fingerprint = p_fingerprint
        LIMIT 1 INTO v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fingerprint % not found.', p_fingerprint;
  END IF;

  RETURN QUERY SELECT * FROM oruser WHERE oruser.id = v_user_id;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
