CREATE OR REPLACE FUNCTION add_key
(p_user_id integer, p_key_type text, p_key_key text, 
p_key_note text, p_key_fingerprint text)
RETURNS SETOF integer AS
$BODY$
DECLARE
BEGIN

  -- heroku doesnt let you add same key twice but silently swallows
  PERFORM id FROM key WHERE user_id = p_user_id AND 
    key_key = p_key_key AND key_type = p_key_type;

  IF NOT FOUND THEN
    INSERT INTO key (user_id, key_type, key_key, key_note,
      key_fingerprint, created_at)
      VALUES (p_user_id, p_key_type, p_key_key, 
      p_key_note, p_key_fingerprint, NOW());
  END IF;

  RETURN QUERY SELECT 1 as affected;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
