CREATE OR REPLACE FUNCTION generate_uuid() RETURNS text AS
$BODY$
  SELECT ENCODE(GEN_RANDOM_BYTES(4), 'hex')::text || '-'
      || ENCODE(GEN_RANDOM_BYTES(2), 'hex')::text || '-'
      || ENCODE(GEN_RANDOM_BYTES(2), 'hex')::text || '-'
      || ENCODE(GEN_RANDOM_BYTES(2), 'hex')::text || '-'
      || ENCODE(GEN_RANDOM_BYTES(6), 'hex')::text
$BODY$
LANGUAGE SQL VOLATILE;
-- vim: set filetype=pgsql :
