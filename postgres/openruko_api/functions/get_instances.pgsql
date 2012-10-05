CREATE OR REPLACE FUNCTION get_instances
  (p_app_id integer, p_type text)
RETURNS 
TABLE(
id text,
app_name text,
command text,
process text,
rendezvous_url text,
elapsed integer,
type text,
attached boolean,
pretty_state text,
state text,
transitioned_at timestamp with time zone) AS
$BODY$
DECLARE
BEGIN
  

  RETURN QUERY SELECT  
    boss_instance.id::text as id,
    boss_instance.name as app_name,
    boss_instance.command::text as command,
    boss_instance.name as process,
    null::text as rendezvous_url,
    extract(epoch from (NOW() - boss_instance.transitioned_at))::integer as elapsed,
    'Ps'::text as type,
    false as attached,
    'up since '::text || boss_instance.transitioned_at::text as pretty_sate,
    boss_instance.state as state,
    boss_instance.transitioned_at as transitioned_at
    FROM boss_instance
    WHERE app_id = p_app_id
    AND (p_type IS NULL OR instance_type = p_type);

END; 
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
