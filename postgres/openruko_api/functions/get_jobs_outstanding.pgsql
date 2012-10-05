CREATE OR REPLACE FUNCTION get_jobs_outstanding()
RETURNS SETOF provision_job AS
$BODY$
DECLARE
BEGIN

  RETURN QUERY SELECT * FROM provision_job 
    WHERE next_action = 'start' AND distributed_at IS NULL;

  RETURN QUERY SELECT * FROM provision_job 
    WHERE next_action = 'kill' AND kill_at IS NULL;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :

