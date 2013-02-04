CREATE TABLE IF NOT EXISTS addon
(
  id serial NOT NULL,
  app_id integer,
  name text,
  CONSTRAINT addon_pkey PRIMARY KEY (id )
)
-- vim: set filetype=pgsql :
