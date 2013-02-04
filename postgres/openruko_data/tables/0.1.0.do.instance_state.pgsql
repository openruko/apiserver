CREATE TABLE IF NOT EXISTS instance_state
(
  id serial NOT NULL,
  state text,
  state_extra_info text,
  transitioned_at timestamp with time zone,
  instance_id text,
  dyno_id text,
  dyno_hostname text,
  CONSTRAINT instance_state_pkey PRIMARY KEY (id )
)
WITH (
  OIDS=FALSE
);
-- vim: set filetype=pgsql :
