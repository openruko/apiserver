CREATE TABLE IF NOT EXISTS app (
  id serial NOT NULL,
  name text NOT NULL,
  user_id integer,
  stack text NOT NULL DEFAULT 'cedar'::text,
  web_url text NOT NULL,
  git_url text NOT NULL,
  create_status text DEFAULT 'creating'::text,
  dynos integer DEFAULT 0,
  workers integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  slugsize integer,
  reposize integer,
  buildpack_provided_description text,
  status text,
  logplex_id text,
  CONSTRAINT apps_pkey PRIMARY KEY (id ),
  /*CONSTRAINT apps_user_id_fkey FOREIGN KEY (user_id)*/
  /*    REFERENCES oruser (id) MATCH SIMPLE*/
  /*    ON UPDATE NO ACTION ON DELETE NO ACTION,*/
  CONSTRAINT apps_name_key UNIQUE (name )
)
WITH (
  OIDS=FALSE
);
-- vim: set filetype=pgsql :
