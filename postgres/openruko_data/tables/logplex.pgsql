CREATE TABLE logplex (
  id text NOT NULL DEFAULT generate_uuid(), 
  app_id integer NOT NULL,
  channel text NOT NULL, -- e.g. app
  source text NOT NULL --  e.g. run.1
)
-- vim: set filetype=pgsql :
