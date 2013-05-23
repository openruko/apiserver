DROP TABLE addon;

CREATE TABLE addon
(
  id serial NOT NULL,
  name text NOT NULL,
  user_id integer NOT NULL,
  config_vars text NOT NULL,
  password text NOT NULL,
  sso_salt text NOT NULL,
  url text NOT NULL,
  sso_url text NOT NULL,
  state text DEFAULT 'beta',
  description text,

  CONSTRAINT addon_pkey PRIMARY KEY (id),
  CONSTRAINT addon_name_key UNIQUE (name)
)
WITH (
  OIDS=FALSE
);

-- vim: set filetype=pgsql :
