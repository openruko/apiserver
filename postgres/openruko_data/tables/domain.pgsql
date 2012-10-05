CREATE TABLE domain
(
  id serial NOT NULL,
  domain text,
  base_domain text,
  app_id integer,
  created_at timestamp with time zone,
  CONSTRAINT domain_key UNIQUE (domain),
  CONSTRAINT domain_pkey PRIMARY KEY (id)
)
-- vim: set filetype=pgsql :
