CREATE OR REPLACE FUNCTION clean()
RETURNS integer AS
$BODY$
DECLARE
BEGIN

  DELETE FROM addon;
  DELETE FROM app;
  DELETE FROM collaborator;
  DELETE FROM domain;
  DELETE FROM instance;
  DELETE FROM instance_state;
  DELETE FROM key;
  DELETE FROM logplex;
  DELETE FROM oruser;
  DELETE FROM provision_job;
  DELETE FROM release;
  DELETE FROM settings;

  RETURN 1;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :

