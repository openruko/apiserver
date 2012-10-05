CREATE OR REPLACE FUNCTION get_job(p_job_id integer)
RETURNS SETOF provision_job AS
$BODY$
DECLARE
  v_matched_job provision_job%rowtype;
BEGIN

  SELECT * FROM provision_job WHERE id = p_job_id INTO v_matched_job;

  IF v_matched_job IS NULL THEN
    RAISE EXCEPTION 'Job not found.';
  ELSE
    RETURN NEXT v_matched_job;
  END IF;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :

