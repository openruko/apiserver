CREATE TABLE release
(
  id serial NOT NULL,
  descr text,
  commit text,
  app_id integer,
  env hstore,
  pstable hstore,
  addons text[],
  created_at timestamp with time zone,
  name text,
  user_email text,
  slug_id text,
  seq_count integer,
  CONSTRAINT release_lock UNIQUE (app_id, seq_count),
  CONSTRAINT release_pkey PRIMARY KEY (id )
)
-- vim: set filetype=pgsql :
