CREATE TABLE IF NOT EXISTS instance
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

DROP INDEX IF EXISTS name_idx;
CREATE INDEX name_idx ON instance (name);

DROP INDEX IF EXISTS retired_idx;
CREATE INDEX retired_idx ON instance (retired);

-- vim: set filetype=pgsql :
