CREATE TABLE IF NOT EXISTS oruser (
  id serial NOT NULL,
  email text NOT NULL,
  password_encrypted text NOT NULL,
  name text NOT NULL,
  created_at timestamp without time zone NOT NULL,
  last_login timestamp without time zone,
  api_key text NOT NULL,
  verified boolean NOT NULL,
  confirmed boolean NOT NULL,
  confirmed_at timestamp without time zone,
  is_super_user boolean,
  verified_at date,
  CONSTRAINT users_pkey PRIMARY KEY (id ),
  CONSTRAINT users_email_key UNIQUE (email )
)
WITH (
  OIDS=FALSE
);
-- vim: set filetype=pgsql :
