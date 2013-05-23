CREATE TABLE IF NOT EXISTS app_addon
(
  id serial NOT NULL,
  app_id integer NOT NULL,
  addon_id integer NOT NULL,
  plan_id integer NOT NULL,
  resource_id text NOT NULL,
  resource_vars hstore,

  CONSTRAINT app_addon_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
-- vim: set filetype=pgsql :
