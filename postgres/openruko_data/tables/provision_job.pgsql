CREATE TABLE provision_job
(
  id serial NOT NULL,
  instance_id text,
  dyno_id text,
  rez_id text,
  template text,
  name text,
  env_vars hstore,
  attached boolean,
  pty boolean,
  command text,
  command_args text[],
  logplex_id text,
  mounts hstore,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  next_action text, -- start or kill
  distributed_at timestamp with time zone,
  distributed_to text,
  kill_at timestamp with time zone, -- kill dispatched at
  kill_method text, -- explicit or via health manager
  CONSTRAINT provision_job_pkey PRIMARY KEY (id)
)
-- vim: set filetype=pgsql :
