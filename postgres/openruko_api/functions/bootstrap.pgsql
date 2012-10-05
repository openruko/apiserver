CREATE OR REPLACE FUNCTION bootstrap(p_schema_name text)
RETURNS TABLE(fn_name text, fn_args text) AS
$BODY$
DECLARE
BEGIN

  RETURN QUERY SELECT proname::text, 
      (proargnames[1:array_upper(string_to_array(proargtypes::text,' '),1)])::text AS
      proargnames
    FROM pg_proc WHERE pronamespace = 
      (SELECT oid FROM pg_namespace 
          WHERE nspname = p_schema_name);
  
END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
