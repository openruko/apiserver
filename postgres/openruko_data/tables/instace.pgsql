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
  CONSTRAINT instance_pkey PRIMARY KEY (id )
)
WITH (
  OIDS=FALSE
);

CREATE INDEX name_idx ON instance (name);
CREATE INDEX retired_idx ON instance (retired);

-- vim: set filetype=pgsql :
