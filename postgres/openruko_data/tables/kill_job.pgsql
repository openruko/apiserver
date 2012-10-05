CREATE TABLE kill_job
(
  id serial NOT NULL,
  dyno_id text,
  dyno_host text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  distributed_at timestamp with time zone,
  distributed_to text,
  CONSTRAINT kill_job_pkey PRIMARY KEY (id)
)
-- vim: set filetype=pgsql :
