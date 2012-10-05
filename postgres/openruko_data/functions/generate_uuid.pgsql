CREATE OR REPLACE FUNCTION generate_uuid() RETURNS text AS
$BODY$
  SELECT ENCODE(GEN_RANDOM_BYTES(16), 'hex')::text
$BODY$
LANGUAGE SQL VOLATILE;
-- vim: set filetype=pgsql :
