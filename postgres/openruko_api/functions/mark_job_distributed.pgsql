CREATE OR REPLACE FUNCTION mark_job_distributed
(p_id integer, p_host text)
RETURNS integer AS
$BODY$
DECLARE
BEGIN

  UPDATE provision_job 
    SET distributed_at = NOW(), distributed_to = p_host WHERE 
      id = p_id AND next_action = 'start';

  UPDATE provision_job 
    SET kill_at = NOW() WHERE 
      id = p_id AND next_action = 'kill';
      
  RETURN 1;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :

