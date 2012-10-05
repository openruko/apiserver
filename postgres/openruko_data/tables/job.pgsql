CREATE TABLE job
(
  id serial NOT NULL,
  job_name text,
  job_payload text,
  distributed_at timestamp with time zone,
  distributed_to text,
  CONSTRAINT job_pkey PRIMARY KEY (id)
)
-- vim: set filetype=pgsql :
