CREATE OR REPLACE FUNCTION scale_instances
(p_app_id integer, p_type text, p_qty integer)
RETURNS integer AS
$BODY$
DECLARE
  v_instance_count integer;
  v_affected_count integer;
  v_instance_diff integer;
  v_current_release record;
  v_type text;
  k_instance boss_instance%rowtype;
  v_new_instance_id text;
BEGIN

  SELECT COUNT(id) FROM boss_instance WHERE
    app_id = p_app_id AND
    instance_type = p_type INTO v_instance_count;

  IF v_instance_count = p_qty THEN
    RETURN 0;
  END IF;


  IF v_instance_count > p_qty THEN

    v_instance_diff = v_instance_count - p_qty;

    FOR k_instance IN  (SELECT * FROM boss_instance
          WHERE app_id = p_app_id
          AND instance_type = p_type
          ORDER BY substring(boss_instance.name from '\.(\d+)$')::integer DESC
          LIMIT v_instance_diff)
    LOOP

      UPDATE instance SET retired = true
        WHERE id = k_instance.id;

      PERFORM stop_instance(p_app_id, k_instance.id);

    END LOOP;

  END IF;

  IF v_instance_count < p_qty THEN

     v_instance_diff = p_qty - v_instance_count;

     SELECT * FROM current_release
        WHERE app_id = p_app_id AND commit IS NOT NULL INTO v_current_release;

     SELECT (coalesce(v_current_release.pstable,
        hstore(array[]::varchar[]))->p_type) INTO v_type;

     IF (SELECT v_type IS NULL) THEN
        RAISE EXCEPTION 'No such type as %', p_type;
     END IF;

     FOR v_new_instance_id IN (SELECT create_instance(p_app_id,
          v_current_release.id,
          p_type,
          v_type)
          AS new_dyno_id
          FROM
            generate_series(v_instance_count + 1,
            v_instance_count + v_instance_diff))
     LOOP

         PERFORM start_instance(p_app_id, v_new_instance_id);

     END LOOP;

  END IF;

  GET DIAGNOSTICS v_affected_count = ROW_COUNT;
  RETURN v_affected_count;

END;
$BODY$
LANGUAGE plpgsql VOLATILE
-- vim: set filetype=pgsql :
