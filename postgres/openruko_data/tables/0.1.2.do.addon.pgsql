DROP TABLE addon;

CREATE TABLE addon
(
  id serial NOT NULL,
  addon_id text NOT NULL,
  user_id integer NOT NULL,
  config_vars text NOT NULL,
  password text NOT NULL,
  sso_salt text NOT NULL,
  url text NOT NULL,
  sso_url text NOT NULL,
  state text DEFAULT 'beta',
  description text,

  CONSTRAINT addon_pkey PRIMARY KEY (id),
  CONSTRAINT addon_addon_id_key UNIQUE (addon_id)
)

-- vim: set filetype=pgsql :
