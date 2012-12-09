CREATE TABLE instance
(
  id text NOT NULL DEFAULT generate_uuid()::text,
  release_id integer,
  app_id integer,
  name text,
  command text,
  attached boolean,
  rendezvous_key uuid,
  instance_type text,
  logplex_id uuid,
  boss_dyno_id text,
  retired boolean,
  port integer,
  CONSTRAINT instance_pkey PRIMARY KEY (id )
)
WITH (
  OIDS=FALSE
);
-- vim: set filetype=pgsql :
