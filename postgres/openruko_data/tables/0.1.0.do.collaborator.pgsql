CREATE TABLE IF NOT EXISTS collaborator
(
  user_id integer NOT NULL,
  app_id integer NOT NULL,
  access text DEFAULT 'edit'::text,
  CONSTRAINT collaborator_pkey PRIMARY KEY (user_id , app_id )
)
WITH (
  OIDS=FALSE
);
-- vim: set filetype=pgsql :
