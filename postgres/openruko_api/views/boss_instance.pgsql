CREATE OR REPLACE VIEW boss_instance AS

  -- we want the last status of each instance
  -- on the most recent dyno_id to hit 'starting' stage 
  -- todo: hide retired

  (SELECT * FROM (SELECT row_number() OVER (PARTITION BY instance.id
  ORDER BY instance_state.transitioned_at DESC) prn,
      instance.id, instance.app_id, '1' AS logplex_id, instance.command AS command, 
      instance.name AS name, instance.rendezvous_key, instance.attached, 
      n.dyno_id, instance_state.dyno_hostname, instance_state.state, 
      instance.instance_type, instance_state.transitioned_at 
    FROM instance,  instance_state,
      (SELECT inst2.dyno_id,inst2.instance_id, row_number() over 
        (partition by inst2.instance_id
        ORDER BY inst2.instance_id, inst2.state != 'starting' ,
        inst2.transitioned_at desc) rn 
        FROM instance_state inst2) n
      WHERE instance.id  = instance_state.instance_id
      AND n.rn = 1 
      AND instance.retired = false
      AND n.instance_id = instance.id
      AND instance_state.dyno_id = n.dyno_id
      ORDER BY transitioned_at DESC) pview WHERE prn = 1)



    


-- vim: set filetype=pgsql :
